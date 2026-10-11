import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { autenticar, mesmoUsuario } from "../middleware/autenticar.js";
import { VAGAS_MAX, VAGAS_MIN, vagasDe } from "../vagas.js";
import { limiteLogin } from "../middleware/limite.js";
import { gerarToken } from "../token.js";
import { notificar } from "../notificacoes.js";
import { validarHorarios } from "../horarios.js";
import type { Horarios } from "../horarios.js";

export const usuariosRouter = Router();

// Bairro e cidade são opcionais (vêm dos detalhes do endereço no Nominatim): texto curto ou null.
const textoCurto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 80) : null);

interface TrajetoRow {
  papel: string; endereco: string; origem_lat: number; origem_lng: number;
  horarios: Horarios;
  carro_modelo: string; carro_lugares: number; carro_consumo: string;
  bairro: string | null; cidade: string | null;
}

function mapTrajeto(r: TrajetoRow) {
  return {
    papel: r.papel,
    endereco: r.endereco,
    bairro: r.bairro,
    cidade: r.cidade,
    origem: { lat: r.origem_lat, lng: r.origem_lng },
    horarios: r.horarios,
    carro: { modelo: r.carro_modelo, lugares: r.carro_lugares, consumo: Number(r.carro_consumo) },
  };
}

usuariosRouter.get("/usuarios/:ra/trajeto", autenticar, mesmoUsuario, async (req, res) => {
  try {
    const { rows } = await pool.query<TrajetoRow>("SELECT * FROM trajetos WHERE usuario_ra = $1", [req.params.ra]);
    res.json(rows[0] ? mapTrajeto(rows[0]) : null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao buscar trajeto" });
  }
});

usuariosRouter.put("/usuarios/:ra/trajeto", autenticar, mesmoUsuario, async (req, res) => {
  const t = req.body ?? {};
  const o = t.origem ?? {};
  const carro = t.carro ?? {};
  if (!t.papel || !t.endereco || typeof o.lat !== "number" || typeof o.lng !== "number") {
    res.status(400).json({ erro: "trajeto incompleto (papel, endereço, origem, horários)" });
    return;
  }
  const horarios = validarHorarios(t.horarios);
  if (!horarios) {
    res.status(400).json({ erro: "Informe a ida ou a volta (HH:MM) em pelo menos um dia de aula." });
    return;
  }
  const vagas = carro.lugares ?? 4;
  if (t.papel === "motorista" && (!Number.isInteger(vagas) || vagas < VAGAS_MIN || vagas > VAGAS_MAX)) {
    res.status(400).json({ erro: `As vagas devem ser de ${VAGAS_MIN} a ${VAGAS_MAX}.` });
    return;
  }
  // Transação: trava o trajeto enquanto confere os aceitos, para um aceite simultâneo não passar.
  const banco = await pool.connect();
  try {
    await banco.query("BEGIN");
    if (t.papel === "motorista") {
      const atual = await vagasDe(banco, String(req.params.ra), true);
      if (atual && vagas < atual.ocupadas) {
        await banco.query("ROLLBACK");
        res.status(409).json({ erro: `Você tem ${atual.ocupadas} caronas aceitas. Desfaça um aceite antes de reduzir as vagas para ${vagas}.` });
        return;
      }
    }
    const { rows } = await banco.query<TrajetoRow>(
      `INSERT INTO trajetos
         (usuario_ra, papel, endereco, origem_lat, origem_lng, horarios, carro_modelo, carro_lugares, carro_consumo, bairro, cidade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (usuario_ra) DO UPDATE SET
         papel = EXCLUDED.papel, endereco = EXCLUDED.endereco,
         origem_lat = EXCLUDED.origem_lat, origem_lng = EXCLUDED.origem_lng,
         horarios = EXCLUDED.horarios,
         carro_modelo = EXCLUDED.carro_modelo, carro_lugares = EXCLUDED.carro_lugares,
         carro_consumo = EXCLUDED.carro_consumo, bairro = EXCLUDED.bairro, cidade = EXCLUDED.cidade,
         atualizado_em = now()
       RETURNING *`,
      [req.params.ra, t.papel, t.endereco, o.lat, o.lng, JSON.stringify(horarios),
       carro.modelo ?? "", vagas, carro.consumo ?? 12, textoCurto(t.bairro), textoCurto(t.cidade)],
    );
    await banco.query("COMMIT");
    res.json(mapTrajeto(rows[0]));
  } catch (e) {
    await banco.query("ROLLBACK").catch(() => {});
    console.error(e);
    res.status(500).json({ erro: "falha ao salvar trajeto" });
  } finally {
    banco.release();
  }
});

// Mesmas regras do cadastro: nome de 2 a 80 caracteres; telefone com DDD (só dígitos, 10 a 13).
const NOME_MIN = 2;
const NOME_MAX = 80;
const SENHA_MIN = 6;

// PATCH — o próprio usuário altera nome e/ou telefone. RA e e-mail não mudam: identificam o aluno.
usuariosRouter.patch("/usuarios/:ra", autenticar, mesmoUsuario, async (req, res) => {
  const { nome, telefone } = req.body ?? {};
  if (nome === undefined && telefone === undefined) {
    res.status(400).json({ erro: "Informe o nome ou o telefone." });
    return;
  }
  const nomeLimpo = nome === undefined ? undefined : String(nome).trim();
  if (nomeLimpo !== undefined && (nomeLimpo.length < NOME_MIN || nomeLimpo.length > NOME_MAX)) {
    res.status(400).json({ erro: `O nome deve ter de ${NOME_MIN} a ${NOME_MAX} caracteres.` });
    return;
  }
  const telDigitos = telefone === undefined ? undefined : String(telefone).replace(/\D/g, "");
  if (telDigitos !== undefined && (telDigitos.length < 10 || telDigitos.length > 13)) {
    res.status(400).json({ erro: "Telefone inválido (use DDD + número)." });
    return;
  }
  try {
    const { rows } = await pool.query(
      `UPDATE usuarios SET nome = COALESCE($2, nome), telefone = COALESCE($3, telefone)
       WHERE ra = $1 RETURNING ra, nome, email, telefone`,
      [req.params.ra, nomeLimpo ?? null, telDigitos ?? null],
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao atualizar os dados" });
  }
});

// PATCH — troca a senha conferindo a atual (com o mesmo limite de tentativas do login). Grava
// senha_alterada_em: o autenticar passa a recusar os tokens antigos, então as sessões abertas
// em outros aparelhos acabam. Quem trocou recebe um token novo e continua logado.
usuariosRouter.patch("/usuarios/:ra/senha", autenticar, mesmoUsuario, limiteLogin, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body ?? {};
  if (!senhaAtual || !novaSenha) {
    res.status(400).json({ erro: "Informe a senha atual e a nova." });
    return;
  }
  if (String(novaSenha).length < SENHA_MIN) {
    res.status(400).json({ erro: `A nova senha deve ter ao menos ${SENHA_MIN} caracteres.` });
    return;
  }
  if (String(novaSenha) === String(senhaAtual)) {
    res.status(400).json({ erro: "A nova senha deve ser diferente da atual." });
    return;
  }
  try {
    const { rows } = await pool.query("SELECT senha_hash FROM usuarios WHERE ra = $1", [req.params.ra]);
    if (!(await bcrypt.compare(String(senhaAtual), rows[0].senha_hash))) {
      res.status(401).json({ erro: "Senha atual incorreta." });
      return;
    }
    const hash = await bcrypt.hash(String(novaSenha), 10);
    // O horário da troca vem do mesmo relógio que assina o token (o do servidor da API, não o do
    // banco): se os dois estivessem fora de sincronia, o token novo poderia ser recusado.
    await pool.query("UPDATE usuarios SET senha_hash = $2, senha_alterada_em = $3, senha_temporaria = false WHERE ra = $1", [req.params.ra, hash, new Date()]);
    // Os aparelhos das sessões encerradas (ex.: um celular perdido) também param de receber os
    // avisos, que trazem nomes. O aparelho de quem trocou se inscreve de novo com o token novo.
    await pool.query("DELETE FROM inscricoes_push WHERE usuario_ra = $1", [req.params.ra]);
    res.json({ token: gerarToken(String(req.params.ra)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao trocar a senha" });
  }
});

// DELETE — o próprio usuário exclui a conta (direito previsto na LGPD), confirmando a senha: uma
// sessão esquecida aberta não basta. Saem em cascata trajeto, pedidos, avaliações, denúncias
// recebidas e aparelhos de notificação; as denúncias que a pessoa fez continuam, anônimas.
// Quem tinha pedido pendente ou carona aceita com ela recebe um aviso.
usuariosRouter.delete("/usuarios/:ra", autenticar, mesmoUsuario, limiteLogin, async (req, res) => {
  const { senha } = req.body ?? {};
  if (!senha) {
    res.status(400).json({ erro: "Confirme com a sua senha." });
    return;
  }
  try {
    const { rows: [eu] } = await pool.query("SELECT nome, senha_hash, admin FROM usuarios WHERE ra = $1", [req.params.ra]);
    // Assim como não podem ser bloqueados, administradores não se excluem pelo app (o painel
    // poderia ficar sem nenhum); isso é feito direto no banco.
    if (eu.admin) {
      res.status(400).json({ erro: "Contas de administrador não podem ser excluídas pelo app." });
      return;
    }
    if (!(await bcrypt.compare(String(senha), eu.senha_hash))) {
      res.status(401).json({ erro: "Senha incorreta." });
      return;
    }
    // Antes de apagar: quem tem pedido pendente ou carona aceita com esta pessoa.
    const { rows: afetados } = await pool.query(
      `SELECT CASE WHEN passageiro_ra = $1 THEN motorista_ra ELSE passageiro_ra END AS ra,
              passageiro_ra = $1 AS era_passageiro, status
       FROM solicitacoes
       WHERE (passageiro_ra = $1 OR motorista_ra = $1) AND status IN ('pendente', 'aceita')`,
      [req.params.ra],
    );
    await pool.query("DELETE FROM usuarios WHERE ra = $1", [req.params.ra]);
    res.status(204).end();

    const primeiro = String(eu.nome).trim().split(/\s+/)[0];
    for (const a of afetados) {
      void notificar(a.ra, a.era_passageiro
        ? { titulo: "Pedido cancelado", corpo: `${primeiro} saiu do CaronaCampus. O pedido de carona foi cancelado.`, url: "/perfil" }
        : { titulo: "Carona cancelada", corpo: `${primeiro} saiu do CaronaCampus. Veja outras caronas compatíveis.`, url: "/caronas" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao excluir a conta" });
  }
});
