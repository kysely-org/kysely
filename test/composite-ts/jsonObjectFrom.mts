import { Kysely } from 'kysely'
import { jsonObjectFrom } from 'kysely/helpers/postgres'

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
        .whereRef('questions.id', '=', 'answers.questionId')
      ).as("answer"),
    )
}
