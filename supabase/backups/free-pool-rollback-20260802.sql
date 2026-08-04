-- Rollback av gratis-pool-rekurateringen 02.08.2026.
-- Gjenoppretter NØYAKTIG de 50 spørsmålene som var free_pool = true før endringen
-- (den opprinnelige kurateringen fra 08.07.2026).
--
-- Kjør hele fila i én transaksjon hvis rekurateringen skal reverseres.
--
-- Bakgrunn: den gamle poolen var 0/6/19 (vanskegrad 1/2/3) for A2 og 3/15/7 for
-- A1/A3 — altså en demo som besto nesten utelukkende av bankens vanskeligste
-- spørsmål, mens den betalte banken var langt lettere. Se completion-page
-- 2026-08-02-gratis-pool-rekuratert.

begin;

update questions set free_pool = false;

update questions set free_pool = true where id in (
  -- A1/A3 (25)
  '1f82e774-497c-4502-b7ec-b1f437dff9db',
  '41c1002d-eb53-4094-8964-d1497e157214',
  '6b345857-c710-4412-bc2b-9ee7a5924a52',
  'd57fc8fb-f7b4-4a27-8553-a6618212b045',
  'df1d9b8b-edca-4479-aad1-81abefadf123',
  '548f3beb-5cee-4c2c-bc70-d2cb62754e49',
  '44f49c80-f2cb-4204-83c2-a6925b761544',
  '6dfe52a5-bc90-483a-b5d5-a1987eca3576',
  '3ae9b77f-6207-491a-8420-3d0903ddc155',
  'e5eb97a2-1ef2-4496-999f-51505b3e409f',
  'eb443c1c-dce2-4d71-bbbd-7697da5fb4db',
  'b71ac323-cf49-482e-b6c8-8a53d8072426',
  'd959ccef-f912-4b4d-8a17-0775397d2cfb',
  'c815c077-7215-4073-8bcb-87cc14315ca6',
  '6002185a-7004-4341-939e-8a388089429b',
  '6cbce73c-d53e-47ac-8452-ba458df24136',
  'cff1e58c-24ec-47a4-bd41-d0e007e9f7b6',
  '32316959-5d6b-4cf4-9e70-54039eff3c63',
  '39641588-6a77-414d-8afc-4ae147fd9167',
  'b2eb1e58-5fc9-4f03-84f4-93d166cdb745',
  'a768b52d-a916-41c2-acb2-590e731ccd0a',
  '9d16c07e-20ff-478a-880c-9d3c712e909a',
  '64f5c5a1-cc24-44cb-8c9b-c1180d577472',
  '1db18e25-c7f9-43ac-80f0-e0122e0184b1',
  'c50c01e0-76be-4580-9b91-90d3ab74f0fa',
  -- A2 (25)
  '34af2a85-932a-4191-b3ee-d20e8ffc0578',
  '7a4527b7-9580-46df-8aec-f06b38b002da',
  '118bea4d-6a41-4052-9083-0eda93070b99',
  '8fca4a8c-50df-4d01-b9f2-b0667735af3a',
  '2172b236-c170-4eb7-b174-01b531e97c14',
  '883ebbd3-2738-4b39-8178-e3ec1b75efd3',
  '3b945e2e-3011-448a-b5a9-6b793c8a199c',
  '72a4454c-f2bc-4c6a-9d55-067e88750ced',
  '6e2acbbc-baef-4752-9d24-65e63fb4078b',
  '7949898f-c00c-4bd4-9e69-f3df32f85852',
  'a780043c-9b92-4fdf-afe2-ad0183b5d056',
  'adda7d87-7a08-4782-9659-ef39ad1e8127',
  'fd838d9a-d03a-41b8-beb5-620e469043d9',
  '13fdd324-4624-4099-a75d-11b6da125359',
  '1df3b80c-1292-41d5-a268-0e0325e01b79',
  '2e8e5b55-c6f1-45b0-9550-a83c449f453c',
  '6853793e-4d48-4487-81e1-d389244c0c88',
  '00da0121-5029-453c-ad2b-b9eed2b8c6ab',
  '895fe5a3-81bf-4d94-90b0-20026fd5a734',
  '65d48c25-4072-44cd-bb72-a83b1209fae7',
  'ffd79fe3-c640-44ad-9bee-0c727ebdb403',
  '3edc0176-11e0-4dc0-aa68-0921de08018b',
  'a1fc41b3-15ac-4587-a000-f152d57b60fe',
  '6ce8681c-7293-4d9f-ae1f-a2925ea42830',
  '0374cfd0-329b-483c-a1de-b536bfd74694'
);

-- Kontroll: skal gi 25 + 25.
-- select exam_type, count(*) from questions where free_pool group by 1;

commit;
