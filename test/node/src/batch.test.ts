import {
  clearDatabase,
  destroyTest,
  initTest,
  TestContext,
  expect,
  insertDefaultDataSet,
  DIALECTS,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: batch`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await insertDefaultDataSet(ctx)
    })

    afterEach(async () => {
      await clearDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    if (dialect !== 'postgres') {
      it('should throw an error when batch is called', () => {
        expect(() => ctx.db.batch()).to.throw(
          'batch execution is not supported by this dialect',
        )
      })

      it('should check adapter supportsBatch flag is false', () => {
        const adapter = ctx.db.getExecutor().adapter
        expect(adapter.supportsBatch).to.equal(false)
      })

      return
    }

    // PostgreSQL-specific batch tests below

    it('should execute multiple select queries in a batch', async () => {
      const [persons, pets] = await ctx.db
        .batch()
        .add(ctx.db.selectFrom('person').selectAll().orderBy('first_name'))
        .add(ctx.db.selectFrom('pet').selectAll().orderBy('name'))
        .execute()

      expect(persons).to.have.length(3)
      expect(pets).to.have.length(3)

      expect(persons.map((p) => p.first_name)).to.eql([
        'Arnold',
        'Jennifer',
        'Sylvester',
      ])
      expect(pets.map((p) => p.name)).to.eql(['Catto', 'Doggo', 'Hammo'])
    })

    it('should execute a single query in a batch', async () => {
      const [persons] = await ctx.db
        .batch()
        .add(ctx.db.selectFrom('person').selectAll())
        .execute()

      expect(persons).to.have.length(3)
    })

    it('should execute mixed query types in a batch', async () => {
      const [selectedPersons, insertResult, updateResult] = await ctx.db
        .batch()
        .add(
          ctx.db
            .selectFrom('person')
            .selectAll()
            .where('first_name', '=', 'Jennifer'),
        )
        .add(
          ctx.db.insertInto('person').values({
            first_name: 'New',
            last_name: 'Person',
            gender: 'other',
          }),
        )
        .add(
          ctx.db
            .updateTable('person')
            .set({ last_name: 'Updated' })
            .where('first_name', '=', 'Arnold'),
        )
        .execute()

      expect(selectedPersons).to.have.length(1)
      expect(selectedPersons[0].first_name).to.equal('Jennifer')

      // Check insert and update worked (no returning clause, so empty arrays)
      expect(insertResult).to.be.an('array').and.to.have.length(0)
      expect(updateResult).to.be.an('array').and.to.have.length(0)

      // Verify the changes
      const allPersons = await ctx.db
        .selectFrom('person')
        .selectAll()
        .orderBy('first_name')
        .execute()

      expect(allPersons).to.have.length(4)

      const newPerson = allPersons.find((p) => p.first_name === 'New')
      void expect(newPerson !== undefined).to.be.true

      expect(
        allPersons.find((p) => p.first_name === 'Arnold')?.last_name,
      ).to.equal('Updated')
    })

    it('should execute delete queries in a batch', async () => {
      const [deleteResult] = await ctx.db
        .batch()
        .add(ctx.db.deleteFrom('pet').where('name', '=', 'Catto'))
        .execute()

      expect(deleteResult).to.have.length(0)

      const remainingPets = await ctx.db
        .selectFrom('pet')
        .selectAll()
        .orderBy('name')
        .execute()

      expect(remainingPets).to.have.length(2)
      expect(remainingPets.map((p) => p.name)).to.eql(['Doggo', 'Hammo'])
    })

    it('should handle empty batch', async () => {
      const results = await ctx.db.batch().execute()

      expect(results).to.have.length(0)
    })

    it('should execute queries with where clauses', async () => {
      const [arnoldPets, jenniferPets] = await ctx.db
        .batch()
        .add(
          ctx.db
            .selectFrom('pet')
            .selectAll()
            .where(
              'owner_id',
              '=',
              ctx.db
                .selectFrom('person')
                .select('id')
                .where('first_name', '=', 'Arnold')
                .limit(1),
            ),
        )
        .add(
          ctx.db
            .selectFrom('pet')
            .selectAll()
            .where(
              'owner_id',
              '=',
              ctx.db
                .selectFrom('person')
                .select('id')
                .where('first_name', '=', 'Jennifer')
                .limit(1),
            ),
        )
        .execute()

      expect(arnoldPets).to.have.length(1)
      expect(jenniferPets).to.have.length(1)
    })

    it('should execute queries with compiled queries', async () => {
      const query1 = ctx.db
        .selectFrom('person')
        .selectAll()
        .where('first_name', '=', 'Arnold')
        .compile()

      const query2 = ctx.db
        .selectFrom('pet')
        .selectAll()
        .where('name', '=', 'Doggo')
        .compile()

      const [persons, pets] = await ctx.db
        .batch()
        .add(query1)
        .add(query2)
        .execute()

      expect(persons).to.have.length(1)
      expect(pets).to.have.length(1)
    })

    it('should work with returning clauses', async () => {
      const [insertedPersons, updatedPersons] = await ctx.db
        .batch()
        .add(
          ctx.db
            .insertInto('person')
            .values({
              first_name: 'Batch',
              last_name: 'Test',
              gender: 'other',
            })
            .returningAll(),
        )
        .add(
          ctx.db
            .updateTable('person')
            .set({ last_name: 'BatchUpdated' })
            .where('first_name', '=', 'Arnold')
            .returningAll(),
        )
        .execute()

      expect(insertedPersons).to.have.length(1)
      expect(insertedPersons[0].first_name).to.equal('Batch')
      expect(insertedPersons[0].last_name).to.equal('Test')

      expect(updatedPersons).to.have.length(1)
      expect(updatedPersons[0].first_name).to.equal('Arnold')
      expect(updatedPersons[0].last_name).to.equal('BatchUpdated')
    })

    it('should work within a transaction', async () => {
      await ctx.db.transaction().execute(async (trx) => {
        // Batch should not be callable on a transaction
        expect(() => {
          ;(trx as any).batch()
        }).to.throw(
          'calling the batch method for a Transaction is not supported',
        )
      })
    })

    it('should preserve query order in results', async () => {
      const [result1, result2, result3] = await ctx.db
        .batch()
        .add(
          ctx.db
            .selectFrom('person')
            .select('first_name')
            .where('first_name', '=', 'Arnold'),
        )
        .add(
          ctx.db
            .selectFrom('person')
            .select('first_name')
            .where('first_name', '=', 'Jennifer'),
        )
        .add(
          ctx.db
            .selectFrom('person')
            .select('first_name')
            .where('first_name', '=', 'Sylvester'),
        )
        .execute()

      expect(result1[0].first_name).to.equal('Arnold')
      expect(result2[0].first_name).to.equal('Jennifer')
      expect(result3[0].first_name).to.equal('Sylvester')
    })

    it('should handle queries that return no results', async () => {
      const [emptyResult, nonEmptyResult] = await ctx.db
        .batch()
        .add(
          ctx.db
            .selectFrom('person')
            .selectAll()
            .where('first_name', '=', 'NonExistent'),
        )
        .add(ctx.db.selectFrom('person').selectAll())
        .execute()

      expect(emptyResult).to.have.length(0)
      expect(nonEmptyResult).to.have.length(3)
    })

    it('should work with complex queries', async () => {
      const [joinResult, aggregateResult] = await ctx.db
        .batch()
        .add(
          ctx.db
            .selectFrom('person')
            .innerJoin('pet', 'pet.owner_id', 'person.id')
            .select(['person.first_name', 'pet.name as pet_name'])
            .orderBy('person.first_name')
            .orderBy('pet.name'),
        )
        .add(
          ctx.db
            .selectFrom('person')
            .select((eb) => [
              'first_name',
              eb.fn.count('id').as('person_count'),
            ])
            .groupBy('first_name')
            .orderBy('first_name'),
        )
        .execute()

      expect(joinResult.length).to.be.greaterThan(0)
      expect(joinResult[0]).to.have.property('pet_name')

      expect(aggregateResult).to.have.length(3)
      expect(aggregateResult[0]).to.have.property('person_count')
    })

    it('should check adapter supportsBatch flag', () => {
      const adapter = ctx.db.getExecutor().adapter
      expect(adapter.supportsBatch).to.equal(true)
    })
  })
}
