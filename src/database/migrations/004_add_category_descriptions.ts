import type { SQLiteDatabase } from 'expo-sqlite';

type MigrationConnection = Pick<SQLiteDatabase, 'execAsync' | 'runAsync'>;

const MVP_CATEGORIES = [
  [
    '10000000-0000-4000-8000-000000000001',
    'Mercearia e despensa',
    'arroz, feijão, macarrão, açúcar, farinha, óleo, café, enlatados, molhos',
  ],
  [
    '10000000-0000-4000-8000-000000000002',
    'Bebidas',
    'água, refrigerante, suco, cerveja, vinho, energético',
  ],
  [
    '10000000-0000-4000-8000-000000000003',
    'Higiene e cuidados pessoais',
    'sabonete, shampoo, pasta de dente, papel higiênico, desodorante',
  ],
  [
    '10000000-0000-4000-8000-000000000004',
    'Limpeza',
    'detergente, sabão, desinfetante, água sanitária, amaciante',
  ],
  [
    '10000000-0000-4000-8000-000000000005',
    'Outros / Casa',
    'utensílios, descartáveis e qualquer item que não se encaixe acima',
  ],
  [
    '10000000-0000-4000-8000-000000000006',
    'Hortifruti',
    'frutas, verduras, legumes, temperos frescos',
  ],
  [
    '10000000-0000-4000-8000-000000000007',
    'Carnes, aves e peixes',
    'carne bovina, frango, porco, peixe, camarão, charque',
  ],
  [
    '10000000-0000-4000-8000-000000000008',
    'Frios, laticínios e ovos',
    'leite, queijo, iogurte, manteiga, presunto, ovos',
  ],
  ['10000000-0000-4000-8000-000000000009', 'Padaria', 'pão, bolo, pão de queijo, torradas frescas'],
  [
    '10000000-0000-4000-8000-000000000010',
    'Congelados e prontos',
    'pizza, lasanha, nuggets, sorvete, açaí congelado, refeições prontas',
  ],
  [
    '10000000-0000-4000-8000-000000000011',
    'Doces, biscoitos e snacks',
    'chocolate, bolacha/biscoito, salgadinho, bala, cereal em barra',
  ],
  ['10000000-0000-4000-8000-000000000012', 'Bebê', 'fralda, lenço umedecido, fórmula, papinha'],
  [
    '10000000-0000-4000-8000-000000000013',
    'Pet',
    'ração, petiscos, areia, produtos de higiene animal',
  ],
] as const;

export async function addCategoryDescriptions(db: MigrationConnection): Promise<void> {
  await db.execAsync(`
    ALTER TABLE categories
    ADD COLUMN description TEXT NOT NULL DEFAULT ''
      CHECK (description = trim(description));
  `);

  const timestamp = new Date().toISOString();

  for (const [id, name, description] of MVP_CATEGORIES) {
    await db.runAsync(
      `INSERT INTO categories (id, name, description, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         description = excluded.description,
         updated_at = excluded.updated_at,
         deleted_at = NULL;`,
      [id, name, description, timestamp, timestamp],
    );
  }
}
