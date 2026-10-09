import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronLeft, Phone, ShieldCheck, Trash2 } from "lucide-react";

// Canal para pedidos sobre os dados (acesso, correção, exclusão).
const CONTATO = "caronacampus.contato@gmail.com";
const ATUALIZADA_EM = "outubro de 2026";

// Política de privacidade em linguagem simples (LGPD). Pública: abre com ou sem login.
// Mesma moldura do Login: tela cheia no celular, "celular" centralizado no desktop.
export function Privacidade() {
  return (
    <div className="flex min-h-dvh justify-center bg-canvas desk:h-dvh desk:items-center desk:bg-shell desk:p-5">
      <div className="no-scrollbar relative flex min-h-dvh w-full flex-col overflow-y-auto bg-canvas px-[22px] pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] text-ink desk:h-[min(812px,100%)] desk:min-h-0 desk:max-w-[430px] desk:rounded-[32px] desk:pb-8 desk:pt-6 desk:shadow-2xl">
        <Link to="/" aria-label="Voltar" className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface transition active:scale-[.98]">
          <ChevronLeft size={19} className="text-sub" />
        </Link>

        <h1 className="mt-5 font-display text-[26px] font-bold tracking-tight">Privacidade</h1>
        <p className="mt-1 text-sm text-sub">Como o CaronaCampus usa os seus dados. Atualizada em {ATUALIZADA_EM}.</p>

        <div className="mt-5 space-y-2.5">
          <Destaque icone={<Phone size={17} />} texto="Seu telefone só aparece para a outra pessoa depois que o motorista aceita o pedido." />
          <Destaque icone={<ShieldCheck size={17} />} texto="Não vendemos seus dados nem usamos para propaganda. É um projeto acadêmico, sem fins comerciais." />
          <Destaque icone={<Trash2 size={17} />} texto="Você pode pedir para ver, corrigir ou apagar seus dados a qualquer momento." />
        </div>

        <Secao titulo="O que guardamos">
          <Item><b>Cadastro:</b> RA, nome, e-mail no formato da Facens e telefone. A senha é guardada embaralhada (hash), e nem a administração consegue lê-la.</Item>
          <Item><b>Trajeto:</b> endereço de saída com a localização no mapa, dias, horários, se você vai como motorista ou passageiro e, para motoristas, modelo, lugares e consumo do carro.</Item>
          <Item><b>Uso do app:</b> pedidos de carona e respostas, notas das avaliações e denúncias.</Item>
          <Item><b>Notificações:</b> só se você ativar no Perfil. Guardamos o endereço que o seu navegador cria para receber os avisos (novo pedido, pedido aceito ou recusado). Ao desativar ou sair da conta, ele é apagado.</Item>
          <Item><b>No seu aparelho:</b> o login fica salvo no navegador por até 7 dias, para você não precisar entrar toda vez.</Item>
        </Secao>

        <Secao titulo="Quem vê o quê">
          <Item><b>Outros alunos logados</b> veem, de quem oferece carona: nome, endereço de saída, horário, carro e nota média. De passageiros, o motorista vê o nome e a nota média de quem pediu.</Item>
          <Item><b>Telefone:</b> só as duas pessoas de um pedido <b>aceito</b>, para combinarem pelo WhatsApp.</Item>
          <Item><b>Denúncias:</b> só a administração. A pessoa denunciada não sabe quem denunciou.</Item>
          <Item><b>Administração:</b> vê os dados de cadastro, os pedidos e as denúncias, apenas para moderar o uso (por exemplo, bloquear uma conta).</Item>
        </Secao>

        <Secao titulo="Serviços de terceiros">
          <Item><b>Mapas e endereços:</b> o OpenStreetMap recebe o texto que você digita na busca de endereço e as coordenadas do mapa; o OSRM recebe os pontos para traçar a rota.</Item>
          <Item><b>Localização (GPS):</b> só é usada quando você toca em “usar minha localização”, para preencher o endereço. Não acompanhamos onde você está.</Item>
          <Item><b>Avisos (push):</b> as notificações passam, criptografadas, pelo serviço de push do seu navegador (Google, Apple ou Mozilla), que as entrega ao aparelho.</Item>
          <Item><b>WhatsApp:</b> a conversa acontece fora do app, conforme as regras do WhatsApp.</Item>
          <Item><b>Hospedagem:</b> o app e o banco de dados ficam em provedores de nuvem (Vercel, Render e Neon).</Item>
        </Secao>

        <Secao titulo="Seus direitos (LGPD)">
          <Item>Você pode pedir acesso, correção ou exclusão dos seus dados, e tirar dúvidas, pelo e-mail <a href={`mailto:${CONTATO}`} className="font-semibold text-brand break-all">{CONTATO}</a>.</Item>
          <Item>Os dados ficam guardados enquanto a sua conta existir. Ao apagar a conta, saem também o trajeto, os pedidos, as avaliações e as denúncias ligadas a ela.</Item>
        </Secao>
      </div>
    </div>
  );
}

function Destaque({ icone, texto }: { icone: ReactNode; texto: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] border border-line bg-surface p-3.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">{icone}</div>
      <p className="text-[13px] leading-snug">{texto}</p>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-base font-bold">{titulo}</h2>
      <ul className="mt-2 space-y-2">{children}</ul>
    </section>
  );
}

function Item({ children }: { children: ReactNode }) {
  return <li className="text-[13px] leading-relaxed text-sub [&_b]:font-semibold [&_b]:text-ink">{children}</li>;
}
