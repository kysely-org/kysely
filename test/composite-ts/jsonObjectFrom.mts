import { Kysely } from 'kysely'

export function foo(
  db: Kysely<{
    answers: {
      id: string
      questionId: string
    };
    questions: {
      id: string
    }
  }>,
) {
  return db
    .selectFrom("answers")
    .selectAll()
    .select((eb) =>
      jsonObjectFrom(
        eb.selectFrom("questions")
        .selectAll('questions')
        .whereRef('questions.id', '=', 'answers.id')
      ).as("answer"),
    )
}
