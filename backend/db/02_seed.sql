INSERT INTO caronas
  (id, nome, bairro, origem_lat, origem_lng, carro, chegada, dias, ponto_nome, ponto_lat, ponto_lng, ponto_caminhada, custo_dia)
VALUES
  ('marina-alves', 'Marina Alves', 'Parque Campolim', -23.523, -47.472, 'Chevrolet Onix', '08:00',
   '{seg,ter,qua,qui,sex}', 'Shopping Iguatemi Esplanada', -23.545, -47.518, '320 m', 8.10),
  ('rafael-costa', 'Rafael Costa', 'Jardim Vergueiro', -23.478, -47.448, 'Hyundai HB20', '07:45',
   '{seg,qua,sex}', 'Shopping Cidade Sorocaba', -23.512, -47.466, '450 m', 9.40),
  ('lucas-pereira', 'Lucas Pereira', 'Vila Hortência', -23.492, -47.478, 'Renault Kwid', '08:15',
   '{seg,ter,qua,qui,sex}', 'Terminal Santo Antônio', -23.506, -47.458, '600 m', 6.90),
  ('camila-rocha', 'Camila Rocha', 'Éden', -23.560, -47.575, 'Toyota Corolla', '08:00',
   '{seg,ter,qua,qui}', 'Terminal Éden', -23.558, -47.560, '700 m', 7.20)
ON CONFLICT (id) DO NOTHING;
