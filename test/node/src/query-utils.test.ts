import {
  AnyQueryBuilder,
  MergeResult,
  isDeleteQueryBuilder,
  isInsertQueryBuilder,
  isMergeQueryBuilder,
  isSelectQueryBuilder,
  isUpdateQueryBuilder,
} from '../../../'

import {
  destroyTest,
  initTest,
  TestContext,
  expect,
  DIALECTS,
  Database,
} from './test-setup.js'

for (const dialect of DIALECTS) {
  describe(`${dialect}: query-utils`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should isSelectQueryBuilder be true', async () => {
      const query = ctx.db
        .selectFrom('person')
        .where('first_name', '=', 'Jennifer')

      expect(query.isSelectQueryBuilder).to.be.true
      expect(isSelectQueryBuilder(query)).to.be.true
      expect(isInsertQueryBuilder(query)).to.be.false
      expect(isUpdateQueryBuilder(query)).to.be.false
      expect(isDeleteQueryBuilder(query)).to.be.false
      expect(isMergeQueryBuilder(query)).to.be.false
    })

    it('should isInsertQueryBuilder be true', async () => {
      const query = ctx.db.insertInto('person').values({
        first_name: 'David',
        last_name: 'Bowie',
        gender: 'male',
      })

      expect(query.isInsertQueryBuilder).to.be.true
      expect(isSelectQueryBuilder(query)).to.be.false
      expect(isInsertQueryBuilder(query)).to.be.true
      expect(isUpdateQueryBuilder(query)).to.be.false
      expect(isDeleteQueryBuilder(query)).to.be.false
      expect(isMergeQueryBuilder(query)).to.be.false
    })

    it('should isUpdateQueryBuilder be true', async () => {
      const query = ctx.db
        .updateTable('person')
        .where('first_name', '=', 'John')
        .set({ last_name: 'Wick' })

      expect(query.isUpdateQueryBuilder).to.be.true
      expect(isSelectQueryBuilder(query)).to.be.false
      expect(isInsertQueryBuilder(query)).to.be.false
      expect(isUpdateQueryBuilder(query)).to.be.true
      expect(isDeleteQueryBuilder(query)).to.be.false
      expect(isMergeQueryBuilder(query)).to.be.false
    })

    it('should isDeleteQueryBuilder be true', async () => {
      const query = ctx.db.deleteFrom('person').where('first_name', '=', 'John')

      expect(query.isDeleteQueryBuilder).to.be.true
      expect(isSelectQueryBuilder(query)).to.be.false
      expect(isInsertQueryBuilder(query)).to.be.false
      expect(isUpdateQueryBuilder(query)).to.be.false
      expect(isDeleteQueryBuilder(query)).to.be.true
      expect(isMergeQueryBuilder(query)).to.be.false
    })

    it('should isMergeQueryBuilder be true', async () => {
      // MergeQueryBuilder
      let query: AnyQueryBuilder<Database, 'person', MergeResult> =
        ctx.db.mergeInto('person')

      expect(query.isMergeQueryBuilder).to.be.true
      expect(isSelectQueryBuilder(query)).to.be.false
      expect(isInsertQueryBuilder(query)).to.be.false
      expect(isUpdateQueryBuilder(query)).to.be.false
      expect(isDeleteQueryBuilder(query)).to.be.false
      expect(isMergeQueryBuilder(query)).to.be.true

      // WheneableMergeQueryBuilder
      query = ctx.db
        .mergeInto('person')
        .using('pet', 'person.id', 'pet.owner_id')

      expect(query.isMergeQueryBuilder).to.be.true
      expect(isSelectQueryBuilder(query)).to.be.false
      expect(isInsertQueryBuilder(query)).to.be.false
      expect(isUpdateQueryBuilder(query)).to.be.false
      expect(isDeleteQueryBuilder(query)).to.be.false
      expect(isMergeQueryBuilder(query)).to.be.true

      // MatchedThenableMergeQueryBuilder
      query = ctx.db
        .mergeInto('person')
        .using('pet', 'person.id', 'pet.owner_id')
        .whenMatched()

      expect(query.isMergeQueryBuilder).to.be.true
      expect(isSelectQueryBuilder(query)).to.be.false
      expect(isInsertQueryBuilder(query)).to.be.false
      expect(isUpdateQueryBuilder(query)).to.be.false
      expect(isDeleteQueryBuilder(query)).to.be.false
      expect(isMergeQueryBuilder(query)).to.be.true

      // NotMatchedThenableMergeQueryBuilder
      query = ctx.db
        .mergeInto('person')
        .using('pet', 'person.id', 'pet.owner_id')
        .whenNotMatched()

      expect(query.isMergeQueryBuilder).to.be.true
      expect(isSelectQueryBuilder(query)).to.be.false
      expect(isInsertQueryBuilder(query)).to.be.false
      expect(isUpdateQueryBuilder(query)).to.be.false
      expect(isDeleteQueryBuilder(query)).to.be.false
      expect(isMergeQueryBuilder(query)).to.be.true
    })
  })
}
