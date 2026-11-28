import { bench } from '@ark/attest'
import type { DB } from '../typings/test-d/huge-db.test-d.js'
import { type SelectQueryBuilder, type Kysely } from '../../dist/index.js'

declare const kysely: Kysely<DB>
declare const kyselyAny: Kysely<any>

let query: SelectQueryBuilder<DB, 'my_table', object>
let queryAny: SelectQueryBuilder<any, 'my_table', object>

console.log('leftJoin.bench.ts:\n')

bench.baseline(() => {
  query = kysely.selectFrom('my_table')
  queryAny = kyselyAny.selectFrom('my_table')
})

bench('kysely..leftJoin(table, k1, k2)', () =>
  query.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([6531, 'instantiations'])

bench('kysely..leftJoin(~table, k1, k2)', () =>
  query.leftJoin(
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b946_',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([21845, 'instantiations'])

bench('kysely..leftJoin(table, ~k1, k2)', () =>
  query.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    // @ts-expect-error
    'my_table.col_164b7896ec8e770207febe0812c5f052_',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([7079, 'instantiations'])

bench('kysely..leftJoin(table, k1, ~k2)', () =>
  query.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    // @ts-expect-error
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4_',
  ),
).types([7082, 'instantiations'])

bench('kysely..leftJoin(table as alias, k1, k2)', () =>
  query.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t2',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    't2.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([6522, 'instantiations'])

bench('kysely..leftJoin(table, cb)', () =>
  query.leftJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([2246, 'instantiations'])

bench('kysely..leftJoin(table, cb with ~column)', () =>
  query.leftJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      // @ts-expect-error
      'my_table.col_164b7896ec8e770207febe0812c5f052_',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([2302, 'instantiations'])

//

bench('kysely..leftJoin(table as alias, cb) x40', () =>
  query
    .leftJoin('table_50c315b1fbd8484b7d31c7bbba602733 as t1', (join) =>
      join
        .onRef('t1.id', '=', 'my_table.id')
        .on('t1.col_b738ecc416fa96f41459da0404cdbf50', 'is', null),
    )
    .leftJoin('table_00970b22f199c1f1097c435cdd756efb as t2', (join) =>
      join
        .onRef('t2.id', '=', 'my_table.id')
        .on('t2.col_f4dffeda79e0ee34f16d57241b615f53', 'is', null),
    )
    .leftJoin('table_8d9107a07a519a3e02e2ce5e0f68bd8b as t3', (join) =>
      join
        .onRef('t3.id', '=', 'my_table.id')
        .on('t3.col_fa769b4ad2c48f942621b456579a2224', 'is', null),
    )
    .leftJoin('table_3ae4d1acdab97e1ef170f779f41ffcce as t4', (join) =>
      join
        .onRef('t4.id', '=', 'my_table.id')
        .on('t4.col_08b4d026d42ae768f63552c6de119d71', 'is', null),
    )
    .leftJoin('table_6fbe4a892ea3ffb941c0ecf6176cb249 as t5', (join) =>
      join
        .onRef('t5.id', '=', 'my_table.id')
        .on('t5.col_66dc451da6180c375f5eccf6a178abbe', 'is', null),
    )
    .leftJoin('table_0b5ac72e03509e06683edcba4b3887ab as t6', (join) =>
      join
        .onRef('t6.id', '=', 'my_table.id')
        .on('t6.col_a538a4b49163b8abcdcff07958d6290c', 'is', null),
    )
    .leftJoin('table_382969f15d228ca40eaaf6ae3af42dd0 as t7', (join) =>
      join
        .onRef('t7.id', '=', 'my_table.id')
        .on('t7.col_08114ce1193bf6826c3277f27236a6d8', 'is', null),
    )
    .leftJoin('table_b1d00f154cae4b5689f1c60fd746cc6c as t8', (join) =>
      join
        .onRef('t8.id', '=', 'my_table.id')
        .on('t8.col_1d726898491fbca9a8dac855d2be1be8', 'is', null),
    )
    .leftJoin('table_3d3048db19a6783cbcd9a6ced2755859 as t9', (join) =>
      join
        .onRef('t9.id', '=', 'my_table.id')
        .on('t9.col_2598a0c1aa229293b50e76e77b92ab0e', 'is', null),
    )
    .leftJoin('table_268590e60e51ec5d0b870c82481f2b2e as t10', (join) =>
      join
        .onRef('t10.id', '=', 'my_table.id')
        .on('t10.col_535325947cf44473a2c18fad07fe9457', 'is', null),
    )
    .leftJoin('table_c7c8d495ce776873a2da62c508138d34 as t11', (join) =>
      join
        .onRef('t11.id', '=', 'my_table.id')
        .on('t11.col_535325947cf44473a2c18fad07fe9457', 'is', null),
    )
    .leftJoin('table_044c3ac3bb3a8f36c94c6914fec4c640 as t12', (join) =>
      join
        .onRef('t12.id', '=', 'my_table.id')
        .on('t12.col_08114ce1193bf6826c3277f27236a6d8', 'is', null),
    )
    .leftJoin('table_5e34805f74fb904a4f6c1cb475154d11 as t13', (join) =>
      join
        .onRef('t13.id', '=', 'my_table.id')
        .on('t13.col_8a79872b2fd9eca20ec1e0823abe36fa', 'is', null),
    )
    .leftJoin('table_aad0e25ecf17545e7bec374e476f9b47 as t14', (join) =>
      join
        .onRef('t14.id', '=', 'my_table.id')
        .on('t14.col_c380dabd328dc1bc21400bb6319fe82e', 'is', null),
    )
    .leftJoin('table_649ac5d5790cfd996132f99bcae54699 as t15', (join) =>
      join
        .onRef('t15.id', '=', 'my_table.id')
        .on('t15.col_d3e721d3f9c12db0276ec46a3921d52b', 'is', null),
    )
    .leftJoin('table_6e128f9931a1632c258c1281fdf4636e as t16', (join) =>
      join
        .onRef('t16.id', '=', 'my_table.id')
        .on('t16.col_25cd93f430d277509b60d4390636895f', 'is', null),
    )
    .leftJoin('table_9616c4051420073951c9dadfe4cfecd8 as t17', (join) =>
      join
        .onRef('t17.id', '=', 'my_table.id')
        .on('t17.col_90ac24349411e6954fc47a05040d032c', 'is', null),
    )
    .leftJoin('table_f0e61821517de97ae60ce2db4211f6de as t18', (join) =>
      join
        .onRef('t18.id', '=', 'my_table.id')
        .on('t18.col_066a120fe3abe924fdd105d2073b3a64', 'is', null),
    )
    .leftJoin('table_fe1a1676504a5a83e3fbf40eec955a58 as t19', (join) =>
      join
        .onRef('t19.id', '=', 'my_table.id')
        .on('t19.col_2f76db193eac6ad0f152563313673ac9', 'is', null),
    )
    .leftJoin('table_0be8b4549e9512252af1761de32647d1 as t20', (join) =>
      join
        .onRef('t20.id', '=', 'my_table.id')
        .on('t20.col_05f720d878e84cf5edf8810ac56f2f47', 'is', null),
    )
    .leftJoin('table_d35939386c5c0d22ce7f7c32e8646e0a as t21', (join) =>
      join
        .onRef('t21.id', '=', 'my_table.id')
        .on('t21.col_2f76db193eac6ad0f152563313673ac9', 'is', null),
    )
    .leftJoin('table_276c7389f255e47fa56f3db3b7b203f4 as t22', (join) =>
      join
        .onRef('t22.id', '=', 'my_table.id')
        .on('t22.col_066a120fe3abe924fdd105d2073b3a64', 'is', null),
    )
    .leftJoin('table_ea23a0a1382ceb403c98dfa1a709b361 as t23', (join) =>
      join
        .onRef('t23.id', '=', 'my_table.id')
        .on('t23.col_6a59e77ab0765a9b1e48a245087e5bbd', 'is', null),
    )
    .leftJoin('table_5a161ff0fcf3e07c472290ed26b22b88 as t24', (join) =>
      join
        .onRef('t24.id', '=', 'my_table.id')
        .on('t24.col_05f720d878e84cf5edf8810ac56f2f47', 'is', null),
    )
    .leftJoin('table_ba15c662ce189e01e69a2426db41e884 as t25', (join) =>
      join
        .onRef('t25.id', '=', 'my_table.id')
        .on('t25.col_5a1d3fcf6b0964812cb1d9ac632408d6', 'is', null),
    )
    .leftJoin('table_1b322cd0c444c827dac7f30ae058a2be as t26', (join) =>
      join
        .onRef('t26.id', '=', 'my_table.id')
        .on('t26.col_869cdfb59eef781ebd6a3b78e43344e6', 'is', null),
    )
    .leftJoin('table_1c9d336338cae6fb14a0990bd1c54bc7 as t27', (join) =>
      join
        .onRef('t27.id', '=', 'my_table.id')
        .on('t27.col_2f76db193eac6ad0f152563313673ac9', 'is', null),
    )
    .leftJoin('table_6d3142ac2a560a1c5c32e699f81bf7ba as t28', (join) =>
      join
        .onRef('t28.id', '=', 'my_table.id')
        .on('t28.col_2fd6a67502ba2fc6e63b23903522d93b', 'is', null),
    )
    .leftJoin('table_9c3e72d53ff7007af15c6f696fb71812 as t29', (join) =>
      join
        .onRef('t29.id', '=', 'my_table.id')
        .on('t29.col_699b1539895a99ae5b9de4f5e8006d7c', 'is', null),
    )
    .leftJoin('table_c3489d7044badb74bfa78892e5af3c50 as t30', (join) =>
      join
        .onRef('t30.id', '=', 'my_table.id')
        .on('t30.col_4f1b7b2483b9bb0a8b355ef69f09d65e', 'is', null),
    )
    .leftJoin('table_0556e22da4d46d9d6f4f679de33c729b as t31', (join) =>
      join
        .onRef('t31.id', '=', 'my_table.id')
        .on('t31.col_e714c1cd11c5b7d1de0c5f6e076020b4', 'is', null),
    )
    .leftJoin('table_8bf9d631744222f061702b22effbed68 as t32', (join) =>
      join
        .onRef('t32.id', '=', 'my_table.id')
        .on('t32.col_f32428508672211d04f041977bc90510', 'is', null),
    )
    .leftJoin('table_c5c92cab080fe1234767a8be5814e634 as t33', (join) =>
      join
        .onRef('t33.id', '=', 'my_table.id')
        .on('t33.col_2f76db193eac6ad0f152563313673ac9', 'is', null),
    )
    .leftJoin('table_fe15a427dc1402f37002fb019dcb3607 as t34', (join) =>
      join
        .onRef('t34.id', '=', 'my_table.id')
        .on('t34.col_1cbcac9ade6914a00f55838acea44222', 'is', null),
    )
    .leftJoin('table_4f88999bf83d95515d96be5a0060a387 as t35', (join) =>
      join
        .onRef('t35.id', '=', 'my_table.id')
        .on('t35.col_f9c22b71f730f5257411ff5461646fe8', 'is', null),
    )
    .leftJoin('table_707742b6518f4d5b912446969bfc2288 as t36', (join) =>
      join
        .onRef('t36.id', '=', 'my_table.id')
        .on('t36.col_9b0c62311c53c898ce6699696d685a14', 'is', null),
    )
    .leftJoin('table_fefdea6d099a9810a67b711700a35a8d as t37', (join) =>
      join
        .onRef('t37.id', '=', 'my_table.id')
        .on('t37.col_6dc961f33219b65a0c2a9287c4565f24', 'is', null),
    )
    .leftJoin('table_1d97d2be8972551ff4d686c373055915 as t38', (join) =>
      join
        .onRef('t38.id', '=', 'my_table.id')
        .on('t38.col_53ca581ab7a5aef5b659bc27c81d5d51', 'is', null),
    )
    .leftJoin('table_5b6c09d8090e38e65507dd7138348724 as t39', (join) =>
      join
        .onRef('t39.id', '=', 'my_table.id')
        .on('t39.col_26fc2a6aec4599af1b0a36cbe6e3939a', 'is', null),
    )
    .leftJoin('table_81859a5a7cf340e00333e133ee83c6a3 as t40', (join) =>
      join
        .onRef('t40.id', '=', 'my_table.id')
        .on('t40.col_f606ffbc02200e165ccbe5bd6e0ce11a', 'is', null),
    ),
).types([90589, 'instantiations'])

bench('kyselyAny..leftJoin(table, k1, k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([876, 'instantiations'])

bench('kyselyAny..leftJoin(~table, k1, k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946_',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([876, 'instantiations'])

bench('kyselyAny..leftJoin(table, ~k1, k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052_',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([876, 'instantiations'])

bench('kyselyAny..leftJoin(table, k1, ~k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4_',
  ),
).types([876, 'instantiations'])

bench('kyselyAny..leftJoin(table as alias, k1, k2)', () =>
  queryAny.leftJoin(
    'table_000a8a0cb7f265a624c851d3e7f8b946 as t2',
    'my_table.col_164b7896ec8e770207febe0812c5f052',
    't2.col_454ff479a3b5a9ef082d9be9ac02a6f4',
  ),
).types([869, 'instantiations'])

bench('kyselyAny..leftJoin(table, cb)', () =>
  queryAny.leftJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([1499, 'instantiations'])

bench('kyselyAny..leftJoin(table, cb with ~column)', () =>
  queryAny.leftJoin('table_000a8a0cb7f265a624c851d3e7f8b946', (join) =>
    join.onRef(
      'my_table.col_164b7896ec8e770207febe0812c5f052_',
      '=',
      'table_000a8a0cb7f265a624c851d3e7f8b946.col_454ff479a3b5a9ef082d9be9ac02a6f4',
    ),
  ),
).types([1499, 'instantiations'])
