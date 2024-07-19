/**
 * This file is more of a performance test. The tests in this file will become
 * extremely slow if type performance regressions are introduced to the codebase.
 */

import { expectError } from 'tsd'
import { ColumnType, Kysely } from '..'

export type Decimal = ColumnType<string, number | string, number | string>

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>

export interface Table0ec723c3d4ee7229ffba2a11539b0129 {
  col_4ea20fbed0c11321d0d5e8c50873ad43: number
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tablec67d8be002857dd3a70a2c4edaa4671a {
  col_869cdfb59eef781ebd6a3b78e43344e6: Generated<string | null>
  col_b8a21c4934fdc0366222c19c14b9e1b9: Generated<string | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_33cee772b203aed80ee06d3dcb2cbcd0: Generated<number | null>
  id: Generated<number>
  col_40cee1e4d1c6b882095d5d343de8a0e2: Generated<number | null>
  col_458d5f1afc81ae7291a7aaad852dc12a: Generated<string | null>
  col_aeffdc77f4dde5fd265842bc848e92d1: Generated<number | null>
  col_105b287b6f42e3e08bccae5fa0bc1e57: Generated<number | null>
  col_b53dab55eaeda66574268ffea2dd4da0: Generated<string | null>
  col_0e46a6ad6b83de719c1b5b777e48c8c5: Generated<string | null>
  col_aff776838092862d398b58e380901753: Generated<number | null>
}

export interface Table3face097074d5d4ea47610accdd3ffc1 {
  col_7d5c32a33ff432c746e4d4e37423df3a: string
  col_b4e2525113738f1ed80758dbdfc77c51: string
  col_d62f4d956a18fd3eec07e560acd55b59: number
  col_f32428508672211d04f041977bc90510: number
  col_072e823de1daac617e83074311b89962: string
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tableed617265d2d72c8e748ff8796bfa04c4 {
  col_d9bc3ceaea0dddd80b93a2b5c5a7f827: number
  col_3b04aeab47e304b0ae167274f324d5d3: string
  col_b4e2525113738f1ed80758dbdfc77c51: string
  col_7213e317986c96016a753182775fc7e0: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
}

export interface Table6dc0e4bf3b08bdf7391e5d833d1673d6 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_4ab5b1dd04a8cefd62107890b80103cd: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table2f01d1d7b29ae047871b62964df1ecc3 {
  col_2ba95af0fa085c5e3cc3a55e48532985: number
  col_7426b7174c1b7d22061329a60b94e63f: number
  id: Generated<number>
}

export interface Table9f50dbe0b662b9cea0d016836eb72504 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table4b8e90e811d962e132f9550bc90d5443 {
  col_869cdfb59eef781ebd6a3b78e43344e6: Generated<string | null>
  col_33cee772b203aed80ee06d3dcb2cbcd0: Generated<number | null>
  id: Generated<number>
  col_40cee1e4d1c6b882095d5d343de8a0e2: Generated<number | null>
  col_458d5f1afc81ae7291a7aaad852dc12a: Generated<string | null>
  col_aeffdc77f4dde5fd265842bc848e92d1: Generated<number | null>
  col_105b287b6f42e3e08bccae5fa0bc1e57: Generated<number | null>
}

export interface Table0ae6c699b7b44b166093c052150a0d36 {
  col_0dc6bca1e7fe092ff816894c1f2fcada: Generated<string>
  col_3f706bc8748ebe9b1edfcb4e2e03e4c5: Generated<string>
  col_e6892b0d5da4a0f546f52b29d82aab71: Generated<string>
  col_09d498d9fabfec1c421acb34c996c0f2: number
  col_78a802ff9c1d651d6a168acdf039c4a7: number
  id: Generated<number>
}

export interface Table2e45370c867ddf8f0ca7710b63dd2746 {
  col_5e9ee2aa243c91c65fbf94a31806496d: string
  col_7db3960deab1cd20d8b5b1f5501f3987: number
  id: Generated<number>
  col_910c87c70d93d69a64538ffc358a99de: 'detalle' | 'referencias'
}

export interface Table19f57540d944441abc6dcebc976adf96 {
  col_5e9ee2aa243c91c65fbf94a31806496d: string
  col_603225ce2d6e2ff429bde293c04ad734: number
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table1d1b84f13a74383d5b0324a011b609c6 {
  col_bca1167f466e892a6e32edf82abd97bf: number
  col_0edb7526b7143126ccfb957dd13caaeb: number
  col_f9c22b71f730f5257411ff5461646fe8: number
  col_e439bf701f76b768053c59bd57f81f7b: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: Generated<number | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
}

export interface Table42dbaa8105cb92599360aa5169283403 {
  col_bca1167f466e892a6e32edf82abd97bf: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_b1dc1e3377a082304d817664243e7b17: Generated<string | null>
}

export interface Table2f81c25612f8fefd026b753a1753974a {
  col_f9c22b71f730f5257411ff5461646fe8: Generated<number | null>
  col_6ccc67f5bce269cfd6973525010692a0: Generated<number | null>
  col_fb56864b5d334395e35ec45174902736: number
  col_d812f85f291b30d4782f9accdc973515: number
  col_fb3c6ec7d586e24e823cb17a11e0de45: Generated<number | null>
  col_a538a4b49163b8abcdcff07958d6290c: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: Generated<number | null>
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fed6fd6b4a682868e85af10ef151f374: Generated<string | null>
}

export interface Tableded2bdb12664e58a26152ebb5fe676bb {
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: Generated<string | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_41bad005d542c027f208773d3f0f4a28: number
}

export interface Table1c765aad5af6c98fb0ef475fadda911b {
  col_6a59e77ab0765a9b1e48a245087e5bbd: Generated<number>
  col_f9c22b71f730f5257411ff5461646fe8: number
  col_6ccc67f5bce269cfd6973525010692a0: Generated<number | null>
  col_fb3c6ec7d586e24e823cb17a11e0de45: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
}

export interface Table23e7a1e5ab953d2a85a5958458d0d824 {
  col_fb3c6ec7d586e24e823cb17a11e0de45: number
  col_3d54e846d74728347124d4872f3d61b4: Generated<string | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: Generated<string | null>
  col_b114935b452a2d927bd5ac81ad9a3d67: Generated<string | null>
  col_910c87c70d93d69a64538ffc358a99de: Generated<string | null>
  col_41bad005d542c027f208773d3f0f4a28: number
}

export interface Table41bb6a93b802fe08f0b054ae835e2fe4 {
  col_603225ce2d6e2ff429bde293c04ad734: number
  col_f9c22b71f730f5257411ff5461646fe8: number
  id: Generated<number>
}

export interface Table8be6c29eada2e2ef68bef0c9c1401a97 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: Generated<number | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_c37d5771c5258f10ea31baab67cba178: Generated<number | null>
}

export interface Tablee91e54a2c273ec3221b4d98ae8d79d12 {
  col_c7062aaaa576936166196ab3c2e3342d: number
  col_4ddfa5e839c6a6dacce57d66df206943: number
  id: Generated<number>
}

export interface Tablebb08e5d0fa8fd6089eeeb1ba950944a1 {
  col_d08c3aaad1d4c926a4bf283098fcc325: Generated<string | null>
  col_fb56864b5d334395e35ec45174902736: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_249c850f62ea50feb918b095fc56d763: Generated<string | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablecaf406ab258ff4b54413265206d55b45 {
  col_f9c22b71f730f5257411ff5461646fe8: number
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_95a573b127ca2c23a2ed1dbc7d03d29e: string
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date>
}

export interface Table90ffcbc2bfc57b68acac037b0aeae3d4 {
  col_6a59e77ab0765a9b1e48a245087e5bbd: Generated<number>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: Generated<string | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_15e729f544f76d3d0ad6bc3de492f077: string
}

export interface Table1e2c9919a848fb2673ac28780aba041c {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_50cbd0336a73919113afcca87d9d1e48: string
}

export interface Table4f240fba2b420e220c97e6e14c4819c6 {
  col_869cdfb59eef781ebd6a3b78e43344e6: Generated<string | null>
  col_1d9d9279776c5549212200cb14336162: Generated<string | null>
  col_74bf7a1e74042c7a207b4e4d6144b8a1: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_4f84013a8b5e4c2b7529058c8fafcaa8: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_c55b5208e65984aac86ada39165d9d62: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_1f6eddf77651742ff1d83404930b09ae: string
  col_ef1e84bf5d70755290854b1d0d60c91f: string
  col_8b5da04bf1aacd462ab37eec2f0dea98: string
  col_3917508388f24a50271f7088b657123c: Generated<string | null>
  col_eb6047359d3711dac3175270345f5c3b: string
  col_0169235b1b604520a263cfa57a00b7a2: Generated<number>
}

export interface Tablec97e3cdd896ff553853d7817e4a866e2 {
  col_08b4d026d42ae768f63552c6de119d71: Generated<string | null>
  col_066a120fe3abe924fdd105d2073b3a64: Generated<number | null>
  col_a4effcb9a007ae19664a1e3b0704e92f: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_555511eb2ff60ace56c0128985d10cb5: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_35772ed8414e25ad46fc4b92e07853a2: Generated<number | null>
  col_4a7f3834f24f1c5e95aded0726c807e2: Date
  col_8f4a31364a65a9f539032a16e3f4ea8b: Date
  col_ff9d87789325c168e0e8272e8d138a21: Generated<Date | null>
  col_7a9cd04d755a1c1f269ce7184b943521: Date
  col_7426b7174c1b7d22061329a60b94e63f: number
  id: Generated<number>
  col_aac430b49cc975fb51fed9e6d9856548: Generated<number | null>
  col_2cf1ecc054fac526249f379db15f6114: number
  col_89addf722cc48ff1df7954f97e20b10b: Generated<string | null>
  col_2fc68d3ca47f71df3c84961997e28d69: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_0191c0aa0d39de591b5236b304496123: number
  col_f230bd30a85e2ec6bc2da7b727544ed6: number
  col_f609bfdeed2c51dbb142fd03bddfd02a: number
  col_2c4a4b433aedea3b93e0243fba4062f2: number
  col_080cbfe43a25572bb2a66634b6d5dce8: number
  col_5c63e943a6e825630ccaefcbed7a719b: number
  col_a615c4f966221bfcfb8eac6397f4562e: number
  col_a6925a86b76a07e17077ffd5f2990e7b: number
  col_83750383555947e4ccbd9661a0948ffe: number
  col_5c82df9ac5a4aec30ad4eb89769fbcd8: number
  col_4ca76cee384ffac98c8a3e3c8a61bfeb: number
  col_95b1eb6ceb5082a8b459a4722417922d: number
  col_7d39847d54a6fc52735c6a250cfce5eb: string
  col_345e4aa36e0fb44379bce371c87b70f4: Generated<string | null>
  col_910c87c70d93d69a64538ffc358a99de: number
  col_3356a84dafce383906e79fffee87d8bf: Generated<string | null>
  col_b14411549804e01414d6ad1481680844: Generated<string | null>
  col_270d34ae82d8c18c7b46e83fd3556a59: Generated<string | null>
  col_9abb4592b230f6a6fa4214f5d86aaa4d: Generated<string | null>
  col_d512407d4f684d1284b36763038e0ed3: Generated<string | null>
  col_9b4ca322bec71dd7f0296cef261ae8ec: Generated<string | null>
  col_0aff87eb8d3d48fa89e873060f0715d4: Generated<string | null>
}

export interface Table4974bbdf9d728fb538d7507cb9f84842 {
  col_77df54ec5f2bfd959a54c423b59c0d38: number
  id: Generated<number>
  col_ee96bf5f8ef3f927a1a7fc723df4cd90: number
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
}

export interface Tablea3c8286fc7df926fbf05e09a03e2ac77 {
  col_77df54ec5f2bfd959a54c423b59c0d38: number
  id: Generated<number>
  col_ee96bf5f8ef3f927a1a7fc723df4cd90: number
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
}

export interface Table39bdacc8b55267ffc8bf75ff8ec564ce {
  col_fee6d937834161cc73b3698fee871f5c: string
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_9b0c62311c53c898ce6699696d685a14: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_95a573b127ca2c23a2ed1dbc7d03d29e: string
  col_8f4a31364a65a9f539032a16e3f4ea8b: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_25980343ed3b4c231a154e5e88396938: number
  col_fb1ecce130681efa10fd55197773267d: number
  col_d8ad55006c0efc8437cc487b5c5459f6: number
  col_01abc2f9e295923216e8462e3a88bf5d: string
  col_89ea1e31584f13b90dfa66a76569e69c: string
  col_ea7e482493b72c75cf90057ba252352b: number
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_f8b0d195967998d8afabe1b39912ae34: string
  col_ac339ab9133743c084a804cc83010c7a: string
}

export interface Table3d68aac4deb5f76aaffa0df8c01e305a {
  col_c50368ae5e839e9224eb0947f06fc605: number
  col_a9564ebc3289b7a14551baf8ad5ec60a: Date
  id: Generated<number>
  col_a7f4797b61012da3a9c1a8049c8a4974: number
}

export interface Table90a64fc3cea5bc905374973771cafcd3 {
  col_764a70ee8bb195d3475253200bf2e297: number
  col_80ae6f72f9c170f9e1bcae48c1677802: number
  id: Generated<number>
}

export interface Tablec479a580bb37024884d940eeacc9c4aa {
  col_764a70ee8bb195d3475253200bf2e297: number
  id: Generated<number>
  col_b2211a70f2ff7369336027ed47f18f7f: number
}

export interface Table1d62a6c4a9763009cda042181b0c48af {
  col_bd4e67d8c3f68e4b7117a7a88e22b287: string
  id: Generated<number>
  col_e245eb517472187d10441eca2c4a9aeb: number
}

export interface Table916f65bd1433290f26613ccd976c68a7 {
  col_0c22ebe1ceea12bbe3dade54d797497d: number
  id: Generated<number>
  col_53f18391d7b465f6918d73498af5abf0: string
  col_bfd8f7ddc31266f25afd1b6ea43d8750: number
  col_b9091a846b34e0fac6de153fa4634c7b: Generated<number>
  col_0e46a6ad6b83de719c1b5b777e48c8c5: string
}

export interface Tabledb34593d7377d2007d44ba4b47dcec97 {
  col_08de056b6d3139a95d0aaf99f8e3c52e: number
  col_a538a4b49163b8abcdcff07958d6290c: number
  id: Generated<number>
}

export interface Tablef7d7a7557d9db50bd40fe14bd830b9d4 {
  col_25cd93f430d277509b60d4390636895f: string
  col_352ea8d15082ec4cd9b5ffb25fc99c71: number
  col_6d210c02b9f9e0fd7c6bb98e4b23d240: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_46e6bd185eb3c01ad5692d9ab01733b8: number
  col_26286361ce53d0207945814927712ac2: number
  col_2245275cb6562821fd22d2523a2667e8: Date
  col_955e7ed9557ee9c44c59bf005ea23d2d: Date
  col_1139ca108352fe62c38518aeb04c824d: string
  col_699b1539895a99ae5b9de4f5e8006d7c: Generated<number | null>
  col_189501ea5ae0d0ec760d5848ef9b58e4: number
}

export interface Table309c66af6ff8ccb2dcf123e1af40c9c4 {
  col_821c248ea5f31b36e1fef43cbcf38495: number
  col_49a7abbdc564bf92a27c31a936047cda: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  col_c6080ec65b20eed8dd083f2ae705fd28: string
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_1f98c1057055738f2125180731cb2d39: number
  col_1d119125897e514751e695fab638cf81: number
  col_ed9d312bfff3b171743cff4aa1954294: number
}

export interface Table8921b63f9cb21e8293a8c1ddd9edc866 {
  col_0a3a5156d1abf43e019d933129cf1d3d: number
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table2037e68416ae40369fba0a939e7ac693 {
  col_6137cde4893c59f76f005a8123d8e8e6: Generated<string | null>
  col_a7743b12384fd798fdad7bff9e75bee3: Generated<number | null>
  id: Generated<string>
}

export interface Table2b3f160083004c6c92a2ce1faf87067d {
  col_25cd93f430d277509b60d4390636895f: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_62bd695be89e0f07c72268b40df9c2db: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_34e7aea5cf0f74ee76b3f5445a3ac1cf: Date
  col_c84d2025f9e13529cf7b4aa05275bdf6: Date
  id: Generated<number>
  col_2fd6a67502ba2fc6e63b23903522d93b: Generated<number | null>
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_97ec9689eca8dace826b37d2ed59250b: number
  col_3f9be60473c4a309579563a7358c92f8: number
  col_910c87c70d93d69a64538ffc358a99de: string
  col_07b01206d9860575d30d3b2bdc4ef8b8: number
  col_6200d8f84ce77a52a86aecf31d7ac101: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table5135075fea7b2d1c93603df216620907 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_47800dcca216b1b165c13199d66c3b63: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_e7fa32cb05ba9ddc8d5f75bdf1694790: string
}

export interface Table5d4433ff31ef75511e70aa6e71495afe {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table9e258b1708bd64e877d6cca1467dee66 {
  col_821c248ea5f31b36e1fef43cbcf38495: number
  col_8a79872b2fd9eca20ec1e0823abe36fa: Generated<string>
  col_8ba45d6c9fbc6997e452dc62a60c32aa: Generated<string>
  col_66dc451da6180c375f5eccf6a178abbe: Generated<number | null>
  col_4a375049db156d117c5ad35214dfe424: number
  col_535325947cf44473a2c18fad07fe9457: Generated<number | null>
  col_49a7abbdc564bf92a27c31a936047cda: number
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_50d92f9a5774b1f89abbbc4ac7f546f0: Generated<string>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_62bd695be89e0f07c72268b40df9c2db: number
  col_cc9b81b3318668e7bd040b871602eafd: Generated<string>
  col_970dbef257f683fb01a38f38a4086cc5: Generated<string>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_4649c587e02b1a41f7eb4967032e10c3: Generated<string | null>
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  col_60c9259051ec33ce67fb8dbca8cc0a49: Generated<number>
  id: Generated<number>
  col_e923cd6ce39f1ad88fcf58e070574612: Generated<string>
  col_6fcadaf6349923a75d54632571ccec9d: Generated<string>
  col_e1dfc335e98f95a54ebb2a3335b71817: Generated<number | null>
  col_a5846a54856ff3e7e3427506de9f791c: Generated<number | null>
  col_a846adea5ee689d2a11a692bafbc2dae: Generated<Date | null>
  col_50eed02f38aae94f07e41395a64cf64b: Generated<string>
  col_5b75dbfc85a5e0870a34cc3bfa2cf2ae: Generated<string>
  col_2700d8a25d8d8e80c4ad5b622ea5dbec: number
  col_7d39847d54a6fc52735c6a250cfce5eb: Generated<string>
  col_53a208b112254787b9ebe57338d2e92a: Generated<Decimal>
  col_8f986281fe440bb551e6baa8d3ed2a28: Generated<number>
  col_7f4c1276d300132fccd6f6d32ccb3002: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: Generated<number | null>
  col_d849e38a75aa2b36a69eff901e6af371: Generated<'auto' | 'validado'>
}

export interface Table4ed17d356988e97fe63e4b4e3b060917 {
  col_2e6b22e3aeade4be1854aa4191f7b786: number
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_1ba1f915f54c8d29d5766cc9b0efe0f2: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablea95d291bccf0be8becb18282bcbf93a9 {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_9dd1bc5c639dd9f27a30853ccf20cf02: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_1ba1f915f54c8d29d5766cc9b0efe0f2: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablee12f5b7476cba16c3b1480cd551d2b42 {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_2d1dc1e61d32d9314f690ef19eb8f9fd: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_1cbcac9ade6914a00f55838acea44222: Generated<number | null>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_806b0741c2f0a4352120014e6e8da433: Generated<number | null>
  col_0e5abe8ffb47ede536aabfba66a14e05: Generated<number | null>
  col_53a208b112254787b9ebe57338d2e92a: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablea6ca43be611a38117221fef4c761f97d {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_843fac686ca11587b97725cce2efc1d3: Date
  col_2d1dc1e61d32d9314f690ef19eb8f9fd: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_1cbcac9ade6914a00f55838acea44222: number
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_59ec69fccca64cd638f1a7bf443b435c: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablef83eda9e66948a4da342fadf183e32c3 {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_983e58ca1a916d68762b2e241424e85c: number
  id: Generated<number>
  col_1ba1f915f54c8d29d5766cc9b0efe0f2: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tabledfc2f0e19fe1c0e8dd04191a3035bac8 {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_be69efe0e6bc75464cc24f246e61a62d: number
  id: Generated<number>
  col_1ba1f915f54c8d29d5766cc9b0efe0f2: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table93f030da0924f35ab2e57081dad1e2fb {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_22bd050ad65b2aa12639b75318b0864b: number
  col_1ba1f915f54c8d29d5766cc9b0efe0f2: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table59fc5666d6be52faaeb255fb48a401ef {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_1ba1f915f54c8d29d5766cc9b0efe0f2: Generated<number>
  col_fd21606544b271feae0784633a57d457: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table29c7f8f8df026c49d8ea3ad088e8780a {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_1ba1f915f54c8d29d5766cc9b0efe0f2: Generated<number>
  col_a1625f77580ae88538a0bba96298b5ba: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table2e5e86f744edaeea91caedf4496cd21e {
  col_8a79872b2fd9eca20ec1e0823abe36fa: Generated<string | null>
  col_8ba45d6c9fbc6997e452dc62a60c32aa: Generated<string | null>
  col_a538a4b49163b8abcdcff07958d6290c: Generated<number | null>
  col_50d92f9a5774b1f89abbbc4ac7f546f0: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_62bd695be89e0f07c72268b40df9c2db: number
  col_0a1609965fcbf80a8d9847074a93618c: Generated<string | null>
  col_970dbef257f683fb01a38f38a4086cc5: Generated<string | null>
  col_95a573b127ca2c23a2ed1dbc7d03d29e: Generated<string | null>
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  col_a67abae8eff833edb8b78a2ded44f0b3: Date
  id: Generated<number>
  col_a0102029c5185262158dcdb7c1ae4f51: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: Decimal
  col_e85e859e6b11ce398d9c6ba4466648c2: Generated<string | null>
  col_6fcadaf6349923a75d54632571ccec9d: Generated<string | null>
  col_bd5c3d71904e9ae0f0e22b76c11590fd: Generated<string | null>
  col_5b75dbfc85a5e0870a34cc3bfa2cf2ae: Generated<string | null>
  col_910c87c70d93d69a64538ffc358a99de: string
  col_ad3ab5438edd60f6c8638824072acd87: Generated<string | null>
  col_b1146d17cb361aeddbb1108e39afbfd5: Generated<string | null>
}

export interface Table27112b32955bc32b3cf3abc78f6041f7 {
  col_f32428508672211d04f041977bc90510: string
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  col_2f6e73ed4e950f4879aa2dc43e832206: Generated<string | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_e245eb517472187d10441eca2c4a9aeb: number
}

export interface Table6a8129f282adc469ee9233bcf63f20b7 {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_aeffdc77f4dde5fd265842bc848e92d1: number
}

export interface Table55cda7b389c3f5e26b58e806dc82d6cd {
  col_0f38d1a543b96eb8d34b6fcdc9227445: Generated<number>
  col_aa0ae4d63455847b0b02a481f9f38ab7: number
  col_05f720d878e84cf5edf8810ac56f2f47: Generated<string | null>
  col_b599f327b0f1350c83e6466016f68dee: string
  col_3c21e15fe7f88da04c6eb6546f1f0c45: string
  col_55caff057cf8c83fe28641f2903d6bcd: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_e3c09cb3d68235ebdf5820c49f6ef2e0: Generated<string | null>
  col_d48e0f172023094addf3ba3611199190: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_c613b7206854402371564704dbd689db: string
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_d69c485b8a1572710f1a3736bd1ac46c: Generated<'no' | 'si'>
  col_032711695edadad1acb9974d043ec642: Generated<number>
  col_ef1e84bf5d70755290854b1d0d60c91f: string
  col_8b5da04bf1aacd462ab37eec2f0dea98: string
}

export interface Tabledddb567693b67dedccc76feeaf305885 {
  col_05f720d878e84cf5edf8810ac56f2f47: Generated<string | null>
  col_b599f327b0f1350c83e6466016f68dee: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_e3c09cb3d68235ebdf5820c49f6ef2e0: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_c613b7206854402371564704dbd689db: string
  col_cd241d70370d7d244f5103c80efc4b61: Generated<number | null>
  id: Generated<number>
  col_3e68cb4bb944a2eb1873d121e2c1da9f: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_d69c485b8a1572710f1a3736bd1ac46c: Generated<number>
  col_3cc361b85f6e092837024f5ab2bdc2fe: Generated<number>
  col_032711695edadad1acb9974d043ec642: Generated<number>
  col_ef1e84bf5d70755290854b1d0d60c91f: Generated<string | null>
  col_8b5da04bf1aacd462ab37eec2f0dea98: Generated<string | null>
}

export interface Tableb45f137169628885a5507a98a1fd203b {
  col_f32428508672211d04f041977bc90510: number
  col_f77bbbe9a817f1a5818e71efaa20b892: string
  id: Generated<number>
}

export interface Table4d0fb43fef8f71d027e1c62ff7b83c1f {
  col_f83b4cd2b2e7335a200c2da830132390: Date
  id: Generated<number>
  col_fde60bdc79a24d633ee18347600cb41d: string
}

export interface Table26d9e67842818bfccbbfca6020d3441a {
  col_f32428508672211d04f041977bc90510: number
  col_f77bbbe9a817f1a5818e71efaa20b892: string
  id: Generated<number>
}

export interface Tablee6de3a3fdf132b2b794ad9358fe01719 {
  col_748f83ef971bb7d351a413adbf1e8901: number
  id: Generated<number>
  col_7bc8772e9a79ea91b67b0fe68827dd3b: number
  col_428661c5270745369a9118d95829ff49: Generated<Date | null>
  col_b200a854685602c04809e2fad82ee47b: Generated<number | null>
  col_54b8d01ca49e18a004dd65e012f28c4d: Generated<string | null>
}

export interface Table5bdeb7407d8776f9295b3ae2eb482855 {
  col_f32428508672211d04f041977bc90510: number
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: Generated<string | null>
}

export interface Table259a82d9d67d1b779666191753027e2d {
  col_b606d1948094a48e695e46b18cf977b1: Generated<number>
  col_4f1b7b2483b9bb0a8b355ef69f09d65e: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_672a81e3795c2fd45450d85e0d3703e1: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tabledfcfa50cfe70d46b898ed0fe276855e4 {
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  id: Generated<number>
}

export interface Table11e00101e1b2f60d0a2acfcf46151908 {
  col_f4dffeda79e0ee34f16d57241b615f53: Generated<number | null>
  col_b738ecc416fa96f41459da0404cdbf50: Generated<string | null>
  col_25cd93f430d277509b60d4390636895f: string
  col_44381c5d8d2d9361dd21bb7a7facf4b0: Generated<number | null>
  col_0259f6499a0cb3f370a6119054eea3f3: Generated<number | null>
  col_b6fec9e01d482caca6ab785b9c508583: Generated<string | null>
  col_fe3144cfd0702470a18811a50b2a773a: Generated<string | null>
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_4a2d849a39589cdab1bef664bbaf662f: Generated<number | null>
  col_5306bd08c84506786847c551137592aa: Generated<number | null>
  col_f901883e4b25324963cbb061fed4eaec: Generated<string | null>
  col_bb8f173dd39e2bbd2ca8bb502bdd5d7e: number
  col_645e3472df388d4789ad6a12715cc7a9: Generated<number | null>
  col_eade66be3d5c19459dbb52d65e58a9ff: Generated<string | null>
  col_78f5ba4e82866b7d30d1c63b058b5042: Generated<string | null>
  col_ed68df9dcbc6be1e74aa52f2aaac27b3: Generated<string | null>
  col_9b0c62311c53c898ce6699696d685a14: Generated<number | null>
  col_a19773e01d56a8727f9b50bfd98b67a7: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_95a573b127ca2c23a2ed1dbc7d03d29e: Generated<
    'aceptado' | 'rechazado' | 'recibido' | null
  >
  col_7e208df123f1106ac3cf9c9ce582df87: Generated<number | null>
  col_78729121eb966294e69d86f8b656c99d: Generated<string | null>
  col_cac71ab1db07fe38f5915b92b9959348: Generated<string | null>
  col_6310539ac8c0b13a896e8b9634e1e0c8: Generated<number | null>
  col_8d66d088a1a8bcfb6a7477360f1a03e4: Generated<Date | null>
  col_8f4a31364a65a9f539032a16e3f4ea8b: Date
  col_bbeb11288ba33af45a8a7251cb87da2c: Generated<Date | null>
  col_e199cc093d54f6c562ad8d547976c5df: Generated<Date | null>
  col_e26de993b80283e73a98d2f5a7655e44: Generated<Date | null>
  col_7a9cd04d755a1c1f269ce7184b943521: Generated<Date | null>
  col_7426b7174c1b7d22061329a60b94e63f: number
  col_1cc17f0951cd6972739a3cf858f985e2: Generated<number | null>
  col_0364c29fe7237f4f6ffba597544b4f46: Generated<number | null>
  id: Generated<number>
  col_2499572f76367bcbe5ea0e76d6a53cfa: Generated<number | null>
  col_3f38469c48f069fcc4f623bca8c587f6: Generated<string | null>
  col_d6ffe41368d46575efb6f237e05643f8: Generated<number | null>
  col_387852799fd39a75bb0ffbb3a088106e: Generated<number | null>
  col_ea14b84c81e7ebecb1faf4ce83b8826b: number
  col_9a4570bd056ea2d9dd0a6dbb83206443: Generated<number | null>
  col_4002e95484dd522e663c6fac8757d914: Generated<number | null>
  col_01b47914fe373f6ade80d5d3afef6847: Generated<number | null>
  col_a3c438c6f272e35cd2f6e1a4f59dec67: Generated<number | null>
  col_ef8a0d1ea2ae246640e55a5f585324f4: Generated<number | null>
  col_256cd843e152753550cd6aa845f56fd8: Generated<number | null>
  col_6360ba5916d4e8415f464336177c02e7: Generated<number | null>
  col_5410929b23ebb3020d600feea427cdb7: Generated<number | null>
  col_2924351c3f723a33dfd4dc659a06be9c: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_83ca342b1dd50c4c7999010b9ad6683a: Generated<string | null>
  col_43c33f96a8b44d501f45cd6b9382f9df: Generated<string | null>
  col_7b4b1dd4aafa937e34cb562a048e4fbb: Generated<number | null>
  col_0191c0aa0d39de591b5236b304496123: number
  col_2baa55cecfe99708f15031b74cdd7d36: Generated<number | null>
  col_9e2f281c14fe1c305bf0613edb1b5467: Generated<string | null>
  col_cb9ad148d424c04f44d3959334b394d9: Generated<number | null>
  col_9bba3bbc7094c759a61d84f8605ba3b7: Generated<number | null>
  col_5c63e943a6e825630ccaefcbed7a719b: number
  col_41e744edec4d69e40ddd093f4e1b84aa: Generated<number | null>
  col_83750383555947e4ccbd9661a0948ffe: number
  col_02f2a2f220f28476f9c5ae7f0edfc060: Generated<string | null>
  col_6052d6d42f76bc5ee164f458689e7274: Generated<string | null>
  col_1044fcff754bb0008ba077f4fdc005f4: Generated<number | null>
  col_bcbc405c655f95f2343eb1fb3288a05b: Generated<number | null>
  col_aeffdc77f4dde5fd265842bc848e92d1: number
  col_870d427af1d948c352eea11ffd952d1d: number
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_ef1e84bf5d70755290854b1d0d60c91f: string
  col_8ccb00b1ec3203ead93c89b315af7cfa: string
  col_f8b0d195967998d8afabe1b39912ae34: string
  col_0db72b58ea6b0b1a2468f44c3a154621: Generated<number | null>
  col_75afa9f93f59b9a0da5fc050cf61454d: Generated<number | null>
  col_3b24e1adfd3713e88eb334dd342f072b: Generated<number | null>
  col_8c36708787079d53e4bb54ddc6d4cc93: Generated<string | null>
  col_910c87c70d93d69a64538ffc358a99de: number
  col_99b14a294256f4d99bff89feb7483caf: Generated<string | null>
  col_6dbc88c5b052629e050a099e04d7be3f: Generated<number | null>
  col_f1f2f079861a9877106a6209fe34974d: Generated<string | null>
  col_b96e29426fd3636dd5bc9ce5b03a13df: Generated<string | null>
  col_416bce439c6a2ac5ac9dbd1b0947e48a: Generated<Date | null>
  col_079842fe7e15f5de8a65e411c9df3787: Generated<string | null>
  col_0aff87eb8d3d48fa89e873060f0715d4: Generated<string | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
  col_2923af0fb0193af631f34d210c0247df: Generated<number | null>
}

export interface Tableaa828347830464c8d6fb6070585f8786 {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_bbe02f946d5455d74616fc9777557c22: string
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
}

export interface Table5e1a250360f2e59810faaec5dec74bfb {
  col_4f1b7b2483b9bb0a8b355ef69f09d65e: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<Date | null>
  col_7db3960deab1cd20d8b5b1f5501f3987: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablecb67af6a70220cf4b2c4e1121d9351c6 {
  col_c2794c3a6a63d8743b9aa8499f407b15: string
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table01687ac6f71bbab86d7fb8482bf71301 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_80ae6f72f9c170f9e1bcae48c1677802: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: Generated<string | null>
  col_16f39dcb91dd929ebf8bea9f30568523: number
  col_0e759e13c162a5f46e9c6ad11ff37c68: number
}

export interface Tablee4612831426584576f2d39997ccac9c8 {
  col_6a59e77ab0765a9b1e48a245087e5bbd: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: Generated<number | null>
  id: Generated<number>
  col_84267f80102ea16f25ffe6f5be92255e: Generated<number | null>
  col_c55b5208e65984aac86ada39165d9d62: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
}

export interface Tablebca1b3f3c2526216b2f01c01fa85f3f9 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_47800dcca216b1b165c13199d66c3b63: Generated<number | null>
  id: Generated<number>
  col_c55b5208e65984aac86ada39165d9d62: Generated<number | null>
  col_146c07ef2479cedcd54c7c2af5cf3a80: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
}

export interface Tablecac2eaeb16e94e019e7e98240c4bac17 {
  col_3886a084aa5ac96babd5443af176b2fa: Generated<number | null>
  col_e91148e8d587cad1668a1e01d4701bd4: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_756c412732c9e787f483d35d939b8ef2: Generated<string | null>
}

export interface Table7eb5460a0c6690c1dff53fe4940240db {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table5c88bed5704d2054a84d44150bf10f21 {
  col_f60a220f6974819d5fb5760aed1c4cd0: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_756c412732c9e787f483d35d939b8ef2: string
}

export interface Table148eb9256ed9e01df75e345bd7e5c9f7 {
  col_d109701b76ff710c8e7fddd648466bac: string
  col_066a120fe3abe924fdd105d2073b3a64: Generated<number | null>
  col_08114ce1193bf6826c3277f27236a6d8: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_4f84013a8b5e4c2b7529058c8fafcaa8: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_3917508388f24a50271f7088b657123c: Generated<string | null>
}

export interface Tablee2c77a8b952bdea3bc2cb7261168ec45 {
  col_c06fbc27fba97ced26a9d976caa41a75: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_a94fa2fac7c75e7343d9de23fa2ee836: number
}

export interface Tableabd2380e09dc7a608bb7e5c33654540e {
  col_6a59e77ab0765a9b1e48a245087e5bbd: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_2cf1ecc054fac526249f379db15f6114: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_f136803ab9c241079ba0cc1b5d02ee77: string
}

export interface Table7117bf3bff290101f4fa6d6de627b58f {
  col_6a59e77ab0765a9b1e48a245087e5bbd: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_8b5da04bf1aacd462ab37eec2f0dea98: Generated<string | null>
  col_f136803ab9c241079ba0cc1b5d02ee77: string
  col_20be803fa76256ebff5a3090a351dce6: string
}

export interface Table202a1f7684d2c58afd3885112de82158 {
  col_6a59e77ab0765a9b1e48a245087e5bbd: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_f136803ab9c241079ba0cc1b5d02ee77: string
}

export interface Table93aeee94c0d8d4e08a56c97185d68ae7 {
  col_6a59e77ab0765a9b1e48a245087e5bbd: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_f136803ab9c241079ba0cc1b5d02ee77: string
}

export interface Table70c085cf2d0edd14f7dbae474f064b1c {
  col_495188e3a36574928230c0e978a9c24b: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
}

export interface Table2b11443e8af088b453d5119d135803ac {
  col_c380dabd328dc1bc21400bb6319fe82e: Generated<number | null>
  col_46df0ccd51bb26538db287f8e4e6e4dd: Generated<number | null>
  col_f32428508672211d04f041977bc90510: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_6f2528e6259a627108655e46967927b1: Generated<number | null>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number | null>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: Generated<string | null>
  col_40cee1e4d1c6b882095d5d343de8a0e2: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_aeffdc77f4dde5fd265842bc848e92d1: Generated<number | null>
  col_de936835b986b7e9a72b8706204dc183: Generated<number>
  col_105b287b6f42e3e08bccae5fa0bc1e57: Generated<number | null>
  col_4bf016b629fc04e08a3080d945fff2e3: Generated<number | null>
  col_10c0a78ec67f5765bb129e53d403a805: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table0a542ca892cb0eea27538d7360f718ec {
  col_6a59e77ab0765a9b1e48a245087e5bbd: Generated<number | null>
  col_76b9a01c6151dd633f8055cde973a800: Generated<number | null>
  col_1d9d9279776c5549212200cb14336162: string
  col_e78e90b28ac15ec4ffca85e98e8c9ba3: Generated<Date | null>
  col_13715b2fa41756ef623ff3afe3ad7061: Generated<number | null>
  col_3886a084aa5ac96babd5443af176b2fa: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_ed9b82a66d24b12f15e6c804b8e2987a: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_1f6eddf77651742ff1d83404930b09ae: string
  col_18f2a0599c2957ceab7b1d9810c178af: Generated<number>
  col_c5afa3714e1eb36f2ef051adb19d53a1: string
  col_50169df6c46157b06e457a2215bafaa3: string
  col_22b038c1818e66252d7965200369f7b8: string
}

export interface Tableb8378493b92a26626ae5745222c8ba69 {
  col_535325947cf44473a2c18fad07fe9457: number
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_62bd695be89e0f07c72268b40df9c2db: number
  col_34e7aea5cf0f74ee76b3f5445a3ac1cf: Date
  col_c84d2025f9e13529cf7b4aa05275bdf6: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date>
  col_2700d8a25d8d8e80c4ad5b622ea5dbec: number
  col_3d1ca4769fb6a0b43de8fd6c85704dde: number
}

export interface Table565a308ecf3782bb5eb0197187361913 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_e78e7faf2c91332782285f057698f37f: string
}

export interface Tablede86128413dcd68bd6d1ca009b6bae17 {
  col_821c248ea5f31b36e1fef43cbcf38495: Generated<string | null>
  col_49a7abbdc564bf92a27c31a936047cda: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
}

export interface Table57dadc25e9a34c53f66b5cb499d75904 {
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
  col_d141deef0d42e47261b99f7b286068d8: Generated<number | null>
  col_f35d7efe3efb3e67af82d59c734bf437: string
}

export interface Table366c7f7bccaea5ff455a9b9265448ebf {
  col_535325947cf44473a2c18fad07fe9457: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_2598a0c1aa229293b50e76e77b92ab0e: Generated<number | null>
  col_8f4a31364a65a9f539032a16e3f4ea8b: Generated<Date | null>
  col_7a9cd04d755a1c1f269ce7184b943521: Generated<Date | null>
  col_6ea44f04ea696f044e04871607c145ab: Generated<string | null>
  col_7426b7174c1b7d22061329a60b94e63f: Generated<string | null>
  col_33cee772b203aed80ee06d3dcb2cbcd0: Generated<number | null>
  id: Generated<number>
  col_3e68cb4bb944a2eb1873d121e2c1da9f: Generated<string | null>
  col_b114935b452a2d927bd5ac81ad9a3d67: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_e66275f52358e1042acff2dc629ecf3d: number
  col_888ef26444026e2cf7e456521447a5cf: number
  col_0169d667d30453fc6d348ede68c6137e: number
  col_0191c0aa0d39de591b5236b304496123: number
  col_ea32f0629d5780f0b84ac3c2dc29354c: number
  col_83750383555947e4ccbd9661a0948ffe: number
  col_ef1e84bf5d70755290854b1d0d60c91f: Generated<string | null>
  col_53a208b112254787b9ebe57338d2e92a: Generated<Decimal>
  col_0511961bf51aa24c76ca49e18e4395e9: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: Generated<number | null>
}

export interface Tablea4ca5018c98bd7912524f97ccd0a8757 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_e7e1b5558e643c883f256414a76e28f7: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date>
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_aeffdc77f4dde5fd265842bc848e92d1: number
}

export interface Table402dd89f94d2a88ccdf049224dfc8700 {
  col_535325947cf44473a2c18fad07fe9457: Generated<number | null>
  col_066a120fe3abe924fdd105d2073b3a64: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_2598a0c1aa229293b50e76e77b92ab0e: Generated<number | null>
  col_8f4a31364a65a9f539032a16e3f4ea8b: Generated<Date | null>
  col_7a9cd04d755a1c1f269ce7184b943521: Generated<Date | null>
  col_6ea44f04ea696f044e04871607c145ab: Generated<string | null>
  col_7426b7174c1b7d22061329a60b94e63f: Generated<string | null>
  id: Generated<number>
  col_3e68cb4bb944a2eb1873d121e2c1da9f: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_e66275f52358e1042acff2dc629ecf3d: number
  col_888ef26444026e2cf7e456521447a5cf: number
  col_0169d667d30453fc6d348ede68c6137e: number
  col_0191c0aa0d39de591b5236b304496123: number
  col_ea32f0629d5780f0b84ac3c2dc29354c: number
  col_83750383555947e4ccbd9661a0948ffe: number
  col_ef1e84bf5d70755290854b1d0d60c91f: Generated<string | null>
  col_53a208b112254787b9ebe57338d2e92a: Generated<Decimal>
  col_0511961bf51aa24c76ca49e18e4395e9: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: Generated<number | null>
}

export interface Table92498a6babb7032cdcad6e43158a3359 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_e7e1b5558e643c883f256414a76e28f7: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date>
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_aeffdc77f4dde5fd265842bc848e92d1: number
}

export interface Tablee90356817b37536144c4cf962e9e5165 {
  col_b44e675732d485b4ded87fd63200ab77: number
  col_21e3dbb834dd41bd22e04928fef6a335: number
  id: Generated<number>
  col_756c412732c9e787f483d35d939b8ef2: string
}

export interface Table61a79fc440f7ca2d4190d47ee809f66c {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_7364a488f431ca7296b76a34417395b4: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_2598a0c1aa229293b50e76e77b92ab0e: Generated<number | null>
  col_8f4a31364a65a9f539032a16e3f4ea8b: Generated<Date | null>
  col_1690e4ca8c11ef9d61ca7213686d5c40: Generated<Date | null>
  col_6ea44f04ea696f044e04871607c145ab: Generated<string | null>
  col_7426b7174c1b7d22061329a60b94e63f: Generated<string | null>
  col_d3dfe95339547ab875d57cd71ab15f81: Generated<number | null>
  id: Generated<number>
  col_3e68cb4bb944a2eb1873d121e2c1da9f: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_e66275f52358e1042acff2dc629ecf3d: number
  col_888ef26444026e2cf7e456521447a5cf: number
  col_0169d667d30453fc6d348ede68c6137e: number
  col_835294398c028add3afb4e1cb897a4de: number
  col_0191c0aa0d39de591b5236b304496123: number
  col_ea32f0629d5780f0b84ac3c2dc29354c: number
  col_83750383555947e4ccbd9661a0948ffe: number
  col_ef1e84bf5d70755290854b1d0d60c91f: Generated<string | null>
  col_8b9c30bb3038e2306d0186e3b78f5f3a: Generated<string | null>
  col_53a208b112254787b9ebe57338d2e92a: Generated<Decimal>
  col_0511961bf51aa24c76ca49e18e4395e9: Generated<number | null>
  col_0d15b3ba535af3fa98a18834ca71c71f: Generated<number | null>
  col_079842fe7e15f5de8a65e411c9df3787: Generated<string | null>
  col_0aff87eb8d3d48fa89e873060f0715d4: Generated<string | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: Generated<number | null>
}

export interface Table7051320fedfb456818eb15cdf217186d {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_e7e1b5558e643c883f256414a76e28f7: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date>
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_aeffdc77f4dde5fd265842bc848e92d1: number
}

export interface Table2d7cdf1ccac4544f81ac78a12d5fba7a {
  col_caaf808b80e56775d03b800fc5edf429: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_369ce420bd39cdc51bfcfd33d861ba59: number
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_b1dc1e3377a082304d817664243e7b17: Decimal
}

export interface Tablea8e3bfebcd001eac1185867f7dec94a5 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_910c87c70d93d69a64538ffc358a99de: Generated<string | null>
}

export interface Table148ce21c70970d2809c4028c229445be {
  col_f4dffeda79e0ee34f16d57241b615f53: Generated<number>
  col_b738ecc416fa96f41459da0404cdbf50: Generated<string | null>
  col_44381c5d8d2d9361dd21bb7a7facf4b0: Generated<number | null>
  col_0259f6499a0cb3f370a6119054eea3f3: Generated<number | null>
  col_08114ce1193bf6826c3277f27236a6d8: Generated<number | null>
  col_fe3144cfd0702470a18811a50b2a773a: Generated<string | null>
  col_8ce24ccf64416ee4c1737bf1ab0ea2f8: Generated<string | null>
  col_4f1b7b2483b9bb0a8b355ef69f09d65e: string
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_4a2d849a39589cdab1bef664bbaf662f: Generated<number | null>
  col_5306bd08c84506786847c551137592aa: Generated<number | null>
  col_f901883e4b25324963cbb061fed4eaec: Generated<string | null>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_bb8f173dd39e2bbd2ca8bb502bdd5d7e: number
  col_645e3472df388d4789ad6a12715cc7a9: Generated<number | null>
  col_eade66be3d5c19459dbb52d65e58a9ff: Generated<string | null>
  col_78f5ba4e82866b7d30d1c63b058b5042: Generated<string | null>
  col_ed68df9dcbc6be1e74aa52f2aaac27b3: Generated<string | null>
  col_a222f017034f971d4a5004b53f0e9699: Generated<string | null>
  col_9b0c62311c53c898ce6699696d685a14: Generated<number | null>
  col_a19773e01d56a8727f9b50bfd98b67a7: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_0c7beee8ee787fec23562efa3adbf18a: number
  col_2a5b75864f31fbe839a8f028ee554f53: Generated<number | null>
  col_78729121eb966294e69d86f8b656c99d: Generated<string | null>
  col_cac71ab1db07fe38f5915b92b9959348: Generated<string | null>
  col_6310539ac8c0b13a896e8b9634e1e0c8: Generated<number | null>
  col_1628a3796456964796ddec0bcb38d0e5: Generated<Date | null>
  col_8f4a31364a65a9f539032a16e3f4ea8b: Date
  col_d9d6c97f041fe7c54b65501f67fcfea9: Generated<Date | null>
  col_bbeb11288ba33af45a8a7251cb87da2c: Generated<Date | null>
  col_e199cc093d54f6c562ad8d547976c5df: Generated<Date | null>
  col_e26de993b80283e73a98d2f5a7655e44: Generated<Date | null>
  col_7a9cd04d755a1c1f269ce7184b943521: Generated<Date | null>
  col_7426b7174c1b7d22061329a60b94e63f: number
  col_1cc17f0951cd6972739a3cf858f985e2: Generated<number | null>
  col_0364c29fe7237f4f6ffba597544b4f46: Generated<number | null>
  id: Generated<number>
  col_3f38469c48f069fcc4f623bca8c587f6: Generated<string | null>
  col_d6ffe41368d46575efb6f237e05643f8: Generated<number | null>
  col_478cb1787a1e2a0d75235f14a78b7929: Generated<number | null>
  col_387852799fd39a75bb0ffbb3a088106e: Generated<number | null>
  col_ea14b84c81e7ebecb1faf4ce83b8826b: number
  col_4002e95484dd522e663c6fac8757d914: Generated<number | null>
  col_01b47914fe373f6ade80d5d3afef6847: Generated<number | null>
  col_a3c438c6f272e35cd2f6e1a4f59dec67: Generated<number | null>
  col_ef8a0d1ea2ae246640e55a5f585324f4: Generated<number | null>
  col_256cd843e152753550cd6aa845f56fd8: Generated<number | null>
  col_6360ba5916d4e8415f464336177c02e7: Generated<number | null>
  col_5410929b23ebb3020d600feea427cdb7: Generated<number | null>
  col_2924351c3f723a33dfd4dc659a06be9c: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_83ca342b1dd50c4c7999010b9ad6683a: Generated<string | null>
  col_43c33f96a8b44d501f45cd6b9382f9df: Generated<string | null>
  col_7b4b1dd4aafa937e34cb562a048e4fbb: number
  col_0191c0aa0d39de591b5236b304496123: number
  col_3ad5d52faa1934f2661f8a9d39c48bcf: Generated<number | null>
  col_2baa55cecfe99708f15031b74cdd7d36: Generated<number | null>
  col_9e2f281c14fe1c305bf0613edb1b5467: Generated<string | null>
  col_cb9ad148d424c04f44d3959334b394d9: Generated<string | null>
  col_5c63e943a6e825630ccaefcbed7a719b: number
  col_641b931cd172a7b80d81f8e994faed0f: Generated<number | null>
  col_83750383555947e4ccbd9661a0948ffe: number
  col_32fae7a6a5f2cd2d02cbdfac22bb3aee: Generated<number | null>
  col_02f2a2f220f28476f9c5ae7f0edfc060: Generated<string | null>
  col_6052d6d42f76bc5ee164f458689e7274: Generated<string | null>
  col_1044fcff754bb0008ba077f4fdc005f4: Generated<number | null>
  col_bcbc405c655f95f2343eb1fb3288a05b: Generated<number | null>
  col_9e3a10e7f5449c1de35f219e8d4a0b43: Generated<number | null>
  col_aeffdc77f4dde5fd265842bc848e92d1: number
  col_870d427af1d948c352eea11ffd952d1d: number
  col_ef1e84bf5d70755290854b1d0d60c91f: string
  col_8ccb00b1ec3203ead93c89b315af7cfa: string
  col_8b5da04bf1aacd462ab37eec2f0dea98: string
  col_a0714fe92c4ddead9939c0f656a43ba8: Generated<string | null>
  col_7d39847d54a6fc52735c6a250cfce5eb: Generated<string | null>
  col_0db72b58ea6b0b1a2468f44c3a154621: Generated<number | null>
  col_75afa9f93f59b9a0da5fc050cf61454d: Generated<number | null>
  col_3b24e1adfd3713e88eb334dd342f072b: Generated<number | null>
  col_8c36708787079d53e4bb54ddc6d4cc93: Generated<string | null>
  col_910c87c70d93d69a64538ffc358a99de: number
  col_53a208b112254787b9ebe57338d2e92a: Generated<number | null>
  col_4ab5b1dd04a8cefd62107890b80103cd: Generated<string | null>
  col_6dbc88c5b052629e050a099e04d7be3f: Generated<number | null>
  col_f1f2f079861a9877106a6209fe34974d: Generated<string | null>
  col_972aaa3fbd7b8c3cb772ed1eb78becbb: Generated<string | null>
  col_fb70e10e97efd8bc28a6c9cb1e9f9ff8: Generated<string | null>
  col_b96e29426fd3636dd5bc9ce5b03a13df: Generated<string | null>
  col_5f544d6483d4ce30cf3145abb40f9441: Generated<number | null>
  col_bab5d43498aec1209e8ab958b766cb86: Generated<number | null>
  col_416bce439c6a2ac5ac9dbd1b0947e48a: Generated<Date | null>
  col_079842fe7e15f5de8a65e411c9df3787: Generated<string | null>
  col_0aff87eb8d3d48fa89e873060f0715d4: Generated<string | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
  col_1e36674b6a9b366e7ac7dc0343291399: 'auto' | 'validado'
  col_e7f37cd2de5c3de049e6ef13e7027769: 'auto' | 'validado'
  col_2923af0fb0193af631f34d210c0247df: Generated<number | null>
  col_df82ddd36c8d6387edc8c1d15e9e6e8d: Generated<string | null>
  col_f990fa06e3da84de9a61af49e4b7957f: Generated<string | null>
}

export interface Tablef650c769203b8bd7eed5a8b7e249c0a5 {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_7db3960deab1cd20d8b5b1f5501f3987: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_1ba1f915f54c8d29d5766cc9b0efe0f2: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table8b9070a970ee019dd472ce6c4a08418b {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_3924f75e4f7e65a64d2f06bad0a8da28: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tabled580c05f239408ff0392e235078a0ac9 {
  col_a4513edcdb71f8647001257ec32ab4e1: string
  col_2404b63b8a201d13a8735e0fa9b53478: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_1df5ee28c9955544f2ebe06a6c829b57: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_18697449d7c48cf32cdd4f14857e68ee: string
  col_8368a8c92f592e349b57fc53fe6f98f4: Generated<string | null>
  col_f57dbda547fc6e900a0f8a585ddd9b49: string
  col_910c87c70d93d69a64538ffc358a99de: Generated<string | null>
  col_a94fa2fac7c75e7343d9de23fa2ee836: number
}

export interface Tabledd7d780df70068dcb36a8d8b86bd5298 {
  col_a4c065a7262f640f0ac2b61885f9671c: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_b4226c098cbf79023e9a779b83ccd3c9: string
  col_8a6902c3de19dedef52742ed22cff3ca: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_6177dfccf6065b1ec558e457a24dea33: string
  col_aeffdc77f4dde5fd265842bc848e92d1: number
  col_b1bac0f8e81aa2bc396eb0eacaf93f7d: string
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table48df920caa8cc60fd47820e9d94ea940 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_216979ad27e40ff49f5d477cb3ebad3c: string
  col_1430120f960285493d5121f4e9f1d924: string
}

export interface Table9bb0301f7ca02953fac2add8dcd7630c {
  col_1d726898491fbca9a8dac855d2be1be8: Generated<number | null>
  col_d109701b76ff710c8e7fddd648466bac: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_4f84013a8b5e4c2b7529058c8fafcaa8: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_3e68cb4bb944a2eb1873d121e2c1da9f: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_8b5da04bf1aacd462ab37eec2f0dea98: Generated<string | null>
}

export interface Table5492e76278a71210d7231f4bf905ec2f {
  col_6a59e77ab0765a9b1e48a245087e5bbd: Generated<number>
  col_fa769b4ad2c48f942621b456579a2224: Generated<string | null>
  col_0e26753c5fe14eae84568b5a83e79ded: Generated<number>
  col_08b4d026d42ae768f63552c6de119d71: Generated<string | null>
  col_60f7d4dabf428b3a6d7d624e3e8f92ef: Generated<string>
  col_05f720d878e84cf5edf8810ac56f2f47: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_e3c09cb3d68235ebdf5820c49f6ef2e0: Generated<string | null>
  col_e8597efec888f22158cf26c4a354b45e: Generated<number>
  col_c68408fb5945c7ed27cfe1fb9ac4c2ea: Generated<'afecta' | 'exenta'>
  col_151fd0d998f5df50fcc7d39143f704be:
    | 'acepta'
    | 'agilice'
    | 'bsale'
    | 'iconstruye'
    | 'mipyme'
    | 'nubox'
    | 'otro'
    | 'simpledte'
  col_99a8177c44470ec20b0097b78d30d2ab: number
  col_99f35f96dabaa98303aaa135bfdc0404: Date
  col_a4ce5705c5f18b69e4add952a187bdde: Date
  col_c613b7206854402371564704dbd689db: Generated<string | null>
  col_355ea60efdcf57aa297299ab210b4e7d: Generated<number>
  col_b2272775d9787c60c9479000c8b8088a: Generated<string | null>
  id: Generated<number>
  col_3e68cb4bb944a2eb1873d121e2c1da9f: Generated<string | null>
  col_a766059eaf3814aa9e73448453e9270c: Generated<number | null>
  col_aba4dc94d2f01540b5dbb57d1096c59b: Date
  col_7dab8a0fad43f3c1c0c352252aac807f: Generated<number | null>
  col_98d8d6a239ae64c6f2fc402b7a7847d8: Generated<string | null>
  col_9f7b242c1ab922eb24d0a3ae403e9676: Generated<string | null>
  col_d5a21723ffc4d83c5ab428a5878324b9: string
  col_15deb4ee2f0424b3885142c477ba88b9: string
  col_042f170682938c181254695986457b1b: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number | null>
  col_f639c93a74ec468c5609505b10e90eea: Generated<number>
  col_ba39ea3526b3c7a1ab364b9298d40d78: Generated<number | null>
  col_ad014db14bea88133e71209061b6bd74: Generated<number | null>
  col_90e4c91b2d55ab42c9930ec06e506ee4: Generated<number>
  col_d420d89b7ce762fa312a4437bccb99c6: number
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_e245eb517472187d10441eca2c4a9aeb: Generated<number>
  col_651324890c5c5b8c2193ad39bfa36c05: string
  col_164b7896ec8e770207febe0812c5f052: Generated<number>
  col_40772ba813d97356c66a42e44c29f2f2: Generated<number | null>
  col_4e893eedef52baaf8f70770064c00f91: Generated<number>
  col_1d958835f7ab52daf74459d71c0c66d1: Generated<number>
  col_ef1e84bf5d70755290854b1d0d60c91f: string
  col_91d2a3cd2d79ad40574b4c2ec58584c1: Generated<string | null>
  col_e85a2e013135b7b178241e6fc32327a8: Generated<number | null>
  col_8b5da04bf1aacd462ab37eec2f0dea98: string
  col_cb72fdda441d8ab0ee9b88e25961fd83: Generated<number>
  col_f9dd44edd9eab46a126cfec00a028907: Generated<Date | null>
  col_7c2b7d5981088f354990946bb421e222: string
  col_70b0729c3bbf27533b98759ae98fb40e: Generated<string | null>
}

export interface Tableea8e45026529937b0cecd544d8801cfd {
  col_bdaef2864913fee6a3be8029d46830a6: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_2414ddf934cafab5eb8e6fbe3478710e: string
}

export interface Table574ff9acd571619424cd55716f5f1dfb {
  col_95a573b127ca2c23a2ed1dbc7d03d29e: string
  id: Generated<number>
}

export interface Tablea79aeca54482635868f02356a51fa369 {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tablee7a44a84d410fa64377504e3aa7f72b6 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_99a8177c44470ec20b0097b78d30d2ab: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tabledcc9250fc52d5fbc25a56cf9c4089073 {
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_95a573b127ca2c23a2ed1dbc7d03d29e: Generated<string | null>
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
}

export interface Table4d82bf6c52ed1355768c73593994c5c2 {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: Generated<string | null>
}

export interface Table73f359bc2658d254af39135aed8c3bf2 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_4377992db876783f2aced4af1b7cc195: number
}

export interface Table8cf85c63dc3200ef8145fc0344d00f16 {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: Generated<string | null>
}

export interface Table401ef7ed8ddaa97932ede0de0b157c04 {
  col_95a573b127ca2c23a2ed1dbc7d03d29e: string
  id: Generated<number>
}

export interface Table3e875ede7feab48a89082e0c87c364f0 {
  col_d08c3aaad1d4c926a4bf283098fcc325: string
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_d141deef0d42e47261b99f7b286068d8: Generated<number | null>
}

export interface Table7822bcc86140bf34bc6cdacbd734c0ef {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_a15701e29e0d577f5252d616c1f13273: number
  col_e6c19fe14ec531d7b295d1723a4b8e03: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_72f96160fd66ba04a6c4d17116faca2a: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_6eabf912118c656e74717bf86ec69f73: number
  col_b2211a70f2ff7369336027ed47f18f7f: Generated<number | null>
  col_923c1ce4be0acf2cf56890bbd41ec804: Generated<string>
}

export interface Table459dc31349051f20a755552adaf60c81 {
  col_460c9eed028ead37612e14da1dd10330: number
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_6c5493e52a59d7de52511ba52276ddcd: Generated<number | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_112f837ef3cfed0e17742e284a1769e7: Generated<number | null>
}

export interface Table1b8610f190607dfbdafa9c71f72acd43 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_fb697b0790ebaa204d9bffad490998af: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
}

export interface Table1edc1b921ba66176c3ec62961c248f78 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table9b72afad4afd63d81ab6ef56c926765d {
  col_fc00b65a31d011aa9c5cac6511de984e: Generated<number>
  col_4f1b7b2483b9bb0a8b355ef69f09d65e: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
  col_756c412732c9e787f483d35d939b8ef2: Generated<number>
}

export interface Table309e0b9a80a4ad911a672f7174429e35 {
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  id: Generated<number>
}

export interface Tablea0eb46b195e5cbd5e85384a9a1622c14 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_eeec804da0fd1aeeb188a033dc67b8a2: Generated<string | null>
  col_a2485bfd6e0a49a04be5fbb9ed0123e9: Generated<string | null>
  col_76ef16690bb4ed0aba9768175f242b63: Generated<string | null>
  col_1e23790fd5accaa0afa87349f9791709: Generated<string | null>
  col_f0d54e8da1328799154329bc93eb4b55: string
  col_f1f2f079861a9877106a6209fe34974d: Generated<string | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tableea5b8f9c56ff4ae4cb3c8f22541b33ba {
  col_6a59e77ab0765a9b1e48a245087e5bbd: number
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_1f7ca930a1d20b8732208df17a3f204a: Generated<number | null>
  col_74acc07e501e952b631264318b0a5ba9: Generated<number>
  id: Generated<number>
  col_c55b5208e65984aac86ada39165d9d62: Generated<number | null>
  col_146c07ef2479cedcd54c7c2af5cf3a80: Generated<string>
  col_df15c6be5f4fc31ef5a0a4fe0ae82481: Generated<string | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_aeffdc77f4dde5fd265842bc848e92d1: Generated<number | null>
  col_aff776838092862d398b58e380901753: Generated<number>
}

export interface Table3a87f98012aa2362e8eb64ed4d9e8f65 {
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_0ba81706c32fe49f7691637abff566ac: Generated<number>
}

export interface Tablefe2e32091534caf00911fc7435cbc97b {
  col_6a59e77ab0765a9b1e48a245087e5bbd: number
  col_512820308ce62e853b7c389614ef5adb: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_57785655fe648f6c416a0d3024567b5e: number
  id: Generated<number>
  col_805df4d52c1afca7f1fe90a63e932648: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_3326c052986bfda9670541e3279e2a4d: Generated<number>
}

export interface Table3cdcee0d77b622e8a2ec654a21270877 {
  col_57785655fe648f6c416a0d3024567b5e: number
  id: Generated<number>
  col_169ab89ce8908eabce9ec3b6c5350b3a: Generated<number>
  col_e82af1a7ad08756ecd516aef27dd0510: number
  col_e245eb517472187d10441eca2c4a9aeb: number
  col_e7fa32cb05ba9ddc8d5f75bdf1694790: Generated<string | null>
  col_ed735d6320ed39d39ecf94e63bcbbe78: Generated<string | null>
}

export interface Table8077f242ad5e05394a3dd81ce79565f7 {
  col_90412006b8822d49b8306f1cebb4b244: Generated<number | null>
  col_57785655fe648f6c416a0d3024567b5e: number
  id: Generated<number>
  col_3326c052986bfda9670541e3279e2a4d: Generated<number>
  col_40772ba813d97356c66a42e44c29f2f2: number
}

export interface Table52a8644bfd17799495525f2fd8adc480 {
  col_25cd93f430d277509b60d4390636895f: Generated<string | null>
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number | null>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_c8cdc4633fd519ba66ab3e84fdb9e5b3: Generated<string | null>
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_eeec804da0fd1aeeb188a033dc67b8a2: string
  col_a2485bfd6e0a49a04be5fbb9ed0123e9: Generated<string | null>
  col_53a208b112254787b9ebe57338d2e92a: Generated<Decimal>
  col_0ba2161c945373e22c9989c68a51937c: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: Generated<number | null>
}

export interface Table74bb684c41a71a06f561e10ffa4e3323 {
  col_fc64eb6054f462d6d323dd7c2e2ff768: Decimal
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_f609bfdeed2c51dbb142fd03bddfd02a: Generated<number | null>
  col_5c63e943a6e825630ccaefcbed7a719b: Generated<number | null>
  col_83750383555947e4ccbd9661a0948ffe: Generated<number | null>
  col_b2211a70f2ff7369336027ed47f18f7f: Generated<number | null>
  col_6092393019ca918cd006522bd308d5e8: number
}

export interface Table64ac7b9a171e9af222924b693d44887c {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablefd230cdd0c0d7bc04b06cffa3bc3fa3e {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_9f4a15cb3f14b10397b11f224b181199: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_aff776838092862d398b58e380901753: Generated<number>
}

export interface Table2bf8003c7e2a7344f4d30c3a351926c5 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table5c1f23359d009924d75dac9200da99ab {
  col_fee6d937834161cc73b3698fee871f5c: string
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_9b0c62311c53c898ce6699696d685a14: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_95a573b127ca2c23a2ed1dbc7d03d29e: string
  col_8f4a31364a65a9f539032a16e3f4ea8b: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_25980343ed3b4c231a154e5e88396938: number
  col_fb1ecce130681efa10fd55197773267d: number
  col_d8ad55006c0efc8437cc487b5c5459f6: number
  col_01abc2f9e295923216e8462e3a88bf5d: string
  col_ea7e482493b72c75cf90057ba252352b: number
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_f8b0d195967998d8afabe1b39912ae34: string
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablea6cdaf7c2c1c27d8389fb8ec7831b240 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_c69fd88c6f0d5f2db866eaf69baa2554: string
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: Generated<number | null>
  col_00b4288b12a81b04c5f2479addcec521: Generated<number>
}

export interface Table618b14672aa41a4ddbaa07b4668e9ceb {
  col_066a120fe3abe924fdd105d2073b3a64: number
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  col_7364a488f431ca7296b76a34417395b4: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_e842d3a41f6119b9ea97d9966c87fe4a: number
  id: Generated<number>
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_b2211a70f2ff7369336027ed47f18f7f: number
}

export interface Tablee0ac1a12db533e45722bf75854c5f68f {
  col_25cd93f430d277509b60d4390636895f: string
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_9b0c62311c53c898ce6699696d685a14: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_910c87c70d93d69a64538ffc358a99de: Generated<
    'F20' | 'F22' | 'F29' | 'F30' | 'F50'
  >
  col_91b6293c3ca6646fe348ce8a4f4b4c85: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table6b64130a9ac5e9179051a15684e76956 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_0f8a9471827ba9a9ddd4ce0e2ddd1a00: number
  id: Generated<number>
  col_22bd050ad65b2aa12639b75318b0864b: number
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
}

export interface Tablec3c4b9ba46ff23ee52e9fa59ba4cbd42 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_38a15d7f839694e0cbb6b3feacd63ea8: number
  id: Generated<number>
  col_22bd050ad65b2aa12639b75318b0864b: number
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
}

export interface Tableac8f964f7407177bed83d5a1b563c4be {
  id: Generated<number>
  col_e245eb517472187d10441eca2c4a9aeb: number
  col_91b6293c3ca6646fe348ce8a4f4b4c85: number
  col_b1dc1e3377a082304d817664243e7b17: number
}

export interface Table0e3703752e6fb26a7c95ffbf9ba62354 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table051ebef2507af0ef791ed665f9df9f69 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_20be803fa76256ebff5a3090a351dce6: Generated<string | null>
}

export interface Tablea85ed4b894e81fcae5b5f32832c0a4aa {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_2cf1ecc054fac526249f379db15f6114: number
  col_d2508118d0d39e198d1129d87d692d59: Date
}

export interface Tablef2e554fc6e599ca882cad3f9c8944c5f {
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_2cf1ecc054fac526249f379db15f6114: number
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_a086a44c8be387291cb7ec589a8d144c: number
}

export interface Table92318b69e7164d55b1815a563a4f0fda {
  col_f32428508672211d04f041977bc90510: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_89bd8e97120bfa5bcc0fdbcf4f96365b: Generated<string | null>
  id: Generated<number>
  col_3e68cb4bb944a2eb1873d121e2c1da9f: Generated<string | null>
  col_ea3e5046a32b090e4e792bb30890a129: number
  col_98d8d6a239ae64c6f2fc402b7a7847d8: Generated<string | null>
  col_c94ff636d78c16fd4972b7df1ed9f7f2: Generated<string | null>
  col_fe999c04c29b51909b8ec56ecfbabcb8: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_e245eb517472187d10441eca2c4a9aeb: number
  col_20be803fa76256ebff5a3090a351dce6: Generated<string | null>
}

export interface Table11c3ad790c98516ecb794068e8fe4332 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_ed9174294dbcdc54c009c8087f24fd4e: number
  id: Generated<number>
  col_c55b5208e65984aac86ada39165d9d62: number
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
}

export interface Table0b9fd044caf91b1c9c0decf463f48479 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_6c5493e52a59d7de52511ba52276ddcd: Generated<number>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_47800dcca216b1b165c13199d66c3b63: number
  col_3d40d536360063946092d61d8fb4af97: Generated<string | null>
  id: Generated<number>
  col_c55b5208e65984aac86ada39165d9d62: number
  col_fe999c04c29b51909b8ec56ecfbabcb8: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
}

export interface Tablecb5f0e2e2a6bb82fe0ec713f3001adae {
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table05f7a75fd9ce14b6ff3abafe6a0315cd {
  col_f606ffbc02200e165ccbe5bd6e0ce11a: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_6137cde4893c59f76f005a8123d8e8e6: Generated<string | null>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number>
  col_61ee96e36f87193202f69079c2a248fc: string
  col_c010021498d7345dadc4ec5be041f8d2: Generated<number | null>
  col_9d73dfc1b706d61e28cf50df23ad34be: Generated<number | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_910c87c70d93d69a64538ffc358a99de: Generated<string | null>
  col_f136803ab9c241079ba0cc1b5d02ee77: string
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablef9d0cc88ca4af2fc064f9fe28c1cae51 {
  col_258def64c72dae45f3e4c8516e2111f2: string
  col_c50368ae5e839e9224eb0947f06fc605: number
  col_26fc2a6aec4599af1b0a36cbe6e3939a: Generated<number | null>
  col_aed19f4c9c98622d6661990a56b5ad95: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_ca55f5b1d19aae0a019b8afb8d995ca9: string
  col_f9c55d34dd1668d1fc4a576fc2f8c64b: string
  id: Generated<number>
  col_d7cc8cbac63ee8761aabf7792b5160db: number
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_665cebec3ce1380ce4e3c90b1bedcbf5: Generated<number | null>
  col_76ef16690bb4ed0aba9768175f242b63: string
}

export interface Tabledf515f554daadb410af199b9d2af4968 {
  col_26fc2a6aec4599af1b0a36cbe6e3939a: Generated<number>
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_665cebec3ce1380ce4e3c90b1bedcbf5: Generated<number>
}

export interface Tablee7013b1aa66ff80026b9594533e73417 {
  col_0e9af2c1d8b2bdc39279709d960ee616: Generated<Date | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_de2b14ae7499f90736fc4a92327553a5: Generated<number | null>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number | null>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_55d0da66c8f6617ffc31f4d7e9b9cd6a: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table6fc94749b5f65b04e1364bc84a3b675a {
  col_1019e8dbd935e7e1fbaee27cb45c81c5: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_1590c1c1103e53135f348374eda74d92: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_2cf1ecc054fac526249f379db15f6114: Generated<number | null>
  col_2c0609d963e4d588c6b53d93845d6661: number
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_74af50ad445ae874663c514314c04397: number
  col_a1625f77580ae88538a0bba96298b5ba: number
  col_36e816a9244e63bedbd7bac69c3208ca: number
  col_3a4c1cab8214c2a1f85432d018ac0548: number
}

export interface Table7e5a6e895e47f444ce7042734df8ce92 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table03fcd39a79bd9fbbc8f2f32371eb6a9b {
  col_7844a93ad4b97169834dade975b5beff: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table3edc0e801929e10d8dd381561aa2bd31 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_e8597efec888f22158cf26c4a354b45e: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
}

export interface Table75f7cd025a872d2698d2a6e53a8cd953 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
}

export interface Table075f9410d29eaec83d4f68c3dfa82a10 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_2fd6a67502ba2fc6e63b23903522d93b: number
  col_aaff2deb17374d1ac30c040f6f0552b5: Generated<string | null>
  col_2931dbf568c51f5a95e2e3081491a702: string
  col_3bf01fe7a9112bfabe3af0e2afea3e59: string
  col_f7b98604d9635076cd6f4dd654792206: string
}

export interface Tableb91d0a254d43344084dc0efd98b90946 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_95a573b127ca2c23a2ed1dbc7d03d29e: 'activada' | 'desactivada'
  id: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: Generated<number | null>
}

export interface Table4d4605d2d071f927c338880fcda7b540 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_88e292b9447efefa8460bb2b17d043c0: Generated<string | null>
  col_ee681610cf80275688440d62a3060f1d: Generated<string | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table14a5541144254091c320909a95c4c614 {
  col_484a106f0719881cf489e0fbd80bfc43: Generated<number>
  col_c9774140535fe111b94e064a8c420b98: Generated<number>
  col_662faa62e8249d797277f109de5dbfc2: Date
  col_141e21b657ebc0212411bf8df49a57cf: Date
  col_ce3cb2352c9bc7bfe791dc286b11e4c3: Generated<number>
  col_d8e32557636967bba571034b4660818b: Generated<number>
  col_5d2dad9c812862769b4a934b13695d02: Generated<number>
  col_9b93b26c60773f04b795b6accea9014e: Generated<number>
  col_a1cad862e5cc1c937323caa84259cefb: Generated<number>
  col_e413d6c84d788644dfbcf3bf6fefaabd: Generated<number>
  col_4a375049db156d117c5ad35214dfe424: number
  col_e6a4dce7716be656ec5e052771f82d7d: Generated<number>
  col_62b99d59be819ae40b4b89dc38d01b6b: Generated<number>
  col_c053226db4df10c61509baef89a07cf2: Generated<number>
  col_f9338a582beb27844ddff5a2491b29d3: Generated<number>
  col_d3e721d3f9c12db0276ec46a3921d52b: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d86bec40de826529ed04c5d5bc0f975e: 'historica' | 'provisoria'
}

export interface Tableb16695c526d6fa5e20b329d5eabfd364 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_2257daef930a33efc1b422d4f3d41890: string
  col_a7743b12384fd798fdad7bff9e75bee3: Date
  id: number
  col_f136803ab9c241079ba0cc1b5d02ee77: string
  col_00b4288b12a81b04c5f2479addcec521: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table9eb67e79e0e2abbb0a295904fd81d805 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: Generated<number | null>
  id: Generated<number>
  col_84267f80102ea16f25ffe6f5be92255e: number
  col_b114935b452a2d927bd5ac81ad9a3d67: Generated<string | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablea700a17706246884b5a04cafcebeaa55 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_7426b7174c1b7d22061329a60b94e63f: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_249c850f62ea50feb918b095fc56d763: Generated<string | null>
  col_910c87c70d93d69a64538ffc358a99de: number
}

export interface Table6a853060686c878e7535e29bc3772d73 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_2a5b75864f31fbe839a8f028ee554f53: number
  col_7426b7174c1b7d22061329a60b94e63f: Generated<number | null>
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_6177dfccf6065b1ec558e457a24dea33: Generated<string | null>
  col_b114935b452a2d927bd5ac81ad9a3d67: Generated<string | null>
  col_910c87c70d93d69a64538ffc358a99de: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: Generated<number | null>
}

export interface Table2c1e8df56b265a10929de25e4593033b {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_973428953d32ee6d05ce5873c2f6c139: number
  id: Generated<number>
  col_2228c8ff8da091a3ba7fe63f7bf0d58f: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table3c8b015b7697cce06653b215afc8acd5 {
  col_3886a084aa5ac96babd5443af176b2fa: number
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  id: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablef058a40da08114d390fcea4b81b4f0a8 {
  col_cd0e40950118e419d8215d52940c0b52: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablea6a7b2d92feb037592b7ed49c34d1e54 {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: Generated<string | null>
}

export interface Table4aba31682ab92f6f2baae3f68f9dc1ad {
  col_17472f76c85ecf1c942560d9cf5511ba: Generated<string | null>
  id: Generated<number>
  col_68df1b4eeab1a558d607590173e97fbf: number
  col_bfd8f7ddc31266f25afd1b6ea43d8750: Generated<number>
  col_aeffdc77f4dde5fd265842bc848e92d1: Generated<number | null>
  col_e7fa32cb05ba9ddc8d5f75bdf1694790: Generated<string | null>
  col_9b1db7c4b5f517844f202bf7ffc3bc5a: Generated<string | null>
  col_b53dab55eaeda66574268ffea2dd4da0: Generated<string | null>
  col_0e46a6ad6b83de719c1b5b777e48c8c5: string
  col_62f5fcc9ea1e44509eaecb6e081a39a1: string
}

export interface Table75d4ed2c1cedc7a0f7e36059177a8837 {
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tablec3ba8dac5adcbeb93ed2dd458b6ad4a1 {
  col_4ea20fbed0c11321d0d5e8c50873ad43: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tablee53ad4b421c58913d023a3296c13419e {
  col_61949c8545b648ea08e9494e262449b0: number
  id: Generated<number>
  col_d2a00107fe464a6f02f9c6d81c6921f0: string
  col_71eeffd42498c613691768b775cbf251: Generated<number | null>
  col_f88bdb43cdad67e0a8f355a543132f62: string
  col_5e1fe85ed4421393b4f7a7f36d69f6fc: string
  col_b1dc1e3377a082304d817664243e7b17: number
}

export interface Table980786dce470ebfd2621534ebcd5e6e9 {
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_f88bdb43cdad67e0a8f355a543132f62: string
  col_b1dc1e3377a082304d817664243e7b17: number
}

export interface Table1a270e99026f39aaf8e33546e1c2c39e {
  col_47aba655fea8599b302f71d06d0bab66: Generated<number>
  col_fc64eb6054f462d6d323dd7c2e2ff768: number
  col_066a120fe3abe924fdd105d2073b3a64: number
  col_08114ce1193bf6826c3277f27236a6d8: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_bb8f173dd39e2bbd2ca8bb502bdd5d7e: number
  col_edc2332d18c4df92bd6c29a42e54c63c: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  id: Generated<number>
  col_6ded30065c525d1945f38fc1b77df3fb: Generated<number | null>
  col_f88bdb43cdad67e0a8f355a543132f62: 'CLP' | 'UF' | 'USD'
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_3924f75e4f7e65a64d2f06bad0a8da28: number
  col_885fa91590a5518eb66fcca9a6f11849: Generated<number | null>
  col_9eed1c8dafecf36e8f11783f0f9ee8d3: number
  col_b2211a70f2ff7369336027ed47f18f7f: number
  col_83d043db4fdfe6882fb7f01a09d92b11: Date
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
  col_4856cff2db9bf179e997e2f57c61c649: Generated<number>
}

export interface Table380b3be3b993931074af40f4e0af76f3 {
  col_08de056b6d3139a95d0aaf99f8e3c52e: number
  col_a538a4b49163b8abcdcff07958d6290c: Generated<number | null>
  col_d87b10b303465ebc76c15dccc5cb2b83: Generated<number | null>
  col_ed49a01549ef9030b8a17635d2c0d411: number
  col_6d210c02b9f9e0fd7c6bb98e4b23d240: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_d7f9c190010492e516de3eebbcf3bfdc: string
  col_d8f6edda3ad9cc2d89df66f5b6df3e25: Generated<string | null>
  col_221bd929021f3685ea46aaa5369685fc: Generated<number | null>
  col_15af44699327f9a6bb2f12da27fdf0ce: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_22b7922d2402e25805b18c7fa98d093c: Date
  col_633cdd5118945d8664ed78acc276604f: Date
  id: Generated<number>
  col_4a1aa938bcb545cd35f50b5fb8b8851f: Generated<string | null>
  col_ea14b84c81e7ebecb1faf4ce83b8826b: Generated<number | null>
  col_5bff9cec94f5ab89567a1d0a24c1bfa9: string
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_5607e33e4ae68a12af15c4fa9ada5c93: Generated<number | null>
  col_46e6bd185eb3c01ad5692d9ab01733b8: number
  col_e66275f52358e1042acff2dc629ecf3d: Generated<number | null>
  col_ac23115c19aea6a256fe04d9a8b6b6fb: Generated<number | null>
  col_0191c0aa0d39de591b5236b304496123: Generated<number | null>
  col_68dcfd901c5f8c7d467fdf74b4ac45ac: Generated<number | null>
  col_d8ad55006c0efc8437cc487b5c5459f6: Generated<number | null>
  col_207b11ca5edb8c143e5afe1712ecbb6e: number
  col_8476076b3459ded88a2a4a1863b65a17: Generated<string | null>
  col_1b6b0183f1a79f6d53cc5f8bd5f315d7: Generated<string | null>
  col_7b7ed03cfd1bca988b56026735632df9: Generated<number | null>
  col_ff66cc4c53cea80f652f8e4aa9d4ce6b: Generated<string | null>
  col_6b5cc62667cadeeda2fa4f4be845e772: Generated<string | null>
  col_dc449cf2403d7e1681944d9f4529b394: Generated<string | null>
  col_b96e29426fd3636dd5bc9ce5b03a13df: string
  col_195367e97caee2b9ed726514b7a38efc: string
}

export interface Table4a03b332b99d0dab4e359b9b2e9132f3 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tableb690efdc73ab53d741824e87ddf41a0a {
  col_066a120fe3abe924fdd105d2073b3a64: number
  col_4f1b7b2483b9bb0a8b355ef69f09d65e: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_8f4a31364a65a9f539032a16e3f4ea8b: Date
  col_7a9cd04d755a1c1f269ce7184b943521: Date
  col_7426b7174c1b7d22061329a60b94e63f: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date>
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_ea32f0629d5780f0b84ac3c2dc29354c: number
  col_83750383555947e4ccbd9661a0948ffe: number
  col_53a208b112254787b9ebe57338d2e92a: Generated<Decimal>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table80586ee503601f161507ee3f207fa19a {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table138bb88f13d65a10a42882c2578d7839 {
  col_90ac24349411e6954fc47a05040d032c: Generated<number | null>
  col_a538a4b49163b8abcdcff07958d6290c: Generated<number | null>
  col_9dd1bc5c639dd9f27a30853ccf20cf02: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_62bd695be89e0f07c72268b40df9c2db: number
  col_f514791973dfe8ce52d05f653fff009e: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_973428953d32ee6d05ce5873c2f6c139: number
  col_74050a371c9d77e377772310c43bb55d: Generated<Date | null>
  col_33cee772b203aed80ee06d3dcb2cbcd0: Generated<number | null>
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_48a86579578d404ad2da71aa0b2b99f4: Generated<number | null>
  col_f61843551e5d8934a2b3afa31e66a5d0: Generated<string | null>
  col_a48faef66299d05e03534b08993a3c80: Generated<number | null>
  col_84169a44f95f5e872347716abd594909: number
  col_ada72f8f1643e5c694dbf2a5636f1a64: string
}

export interface Tablef8ad778cddf738c853992b7f5446b4f1 {
  col_25cd93f430d277509b60d4390636895f: string
  col_82a9e3b076bbedd5c288e8b1364c000d: Generated<number>
  col_ebd1ae5512e18049f0c867b187ad74b7: number
  col_c43595b745f255b38d7a1da6a7b6d5aa: number
  col_066a120fe3abe924fdd105d2073b3a64: Generated<number>
  col_08114ce1193bf6826c3277f27236a6d8: Generated<number | null>
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_c1beb04a7642970cf4e59164d0b162ab: Decimal
  col_a222f017034f971d4a5004b53f0e9699: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_2a5b75864f31fbe839a8f028ee554f53: Generated<number>
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  col_d9d6c97f041fe7c54b65501f67fcfea9: Generated<Date | null>
  col_1690e4ca8c11ef9d61ca7213686d5c40: Date
  col_7426b7174c1b7d22061329a60b94e63f: number
  col_0fcee78e15438d90e5191b85092b83bf: Generated<string | null>
  id: Generated<number>
  col_ea14b84c81e7ebecb1faf4ce83b8826b: number
  col_7f2eeb75f4d42d42268e3dcf985ea311: number
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_5c63e943a6e825630ccaefcbed7a719b: Decimal
  col_9c345463e1fec644c6eee8e6158d953f: Generated<string | null>
  col_d69c485b8a1572710f1a3736bd1ac46c: string
  col_99454795142dc6752632d6afc35ccb31: string
  col_885fa91590a5518eb66fcca9a6f11849: Generated<number | null>
  col_b6492f8aa398e19ecf4295c9aaf0e72c: string
  col_08970091b0d2ad51d515d8a311e9acae: number
  col_31f22cda5030a6e16556c8d64f4d229a: number
  col_eb4b47c599bd30509bef47d1ea3a29e0: Decimal
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table9f6e2daac23f8ae268d4557cb47cb202 {
  col_5a1d3fcf6b0964812cb1d9ac632408d6: Generated<string | null>
  col_d9a3bd4bbae376e6fe20396874ab1f84: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_79bb38e8889d83eccbfe56dcb56f7c05: Generated<number | null>
  col_1690e4ca8c11ef9d61ca7213686d5c40: Generated<Date | null>
  id: Generated<number>
  col_817f7773b53a20deae52a267974f26be: Generated<number | null>
  col_678f2cb7abb9b9f59779889d38a6522e: Generated<string | null>
  col_d0fa5f84c5a77f9a1cef6148c1a10afe: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: Generated<Decimal | null>
  col_40772ba813d97356c66a42e44c29f2f2: number
  col_3a5ccab1310685a8dc5a8ecf5d187e56: Generated<string | null>
  col_f136803ab9c241079ba0cc1b5d02ee77: Generated<string | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table7ff09e5ace1dbf00f39b6358c5aa3817 {
  col_1d726898491fbca9a8dac855d2be1be8: Generated<number>
  id: Generated<number>
  col_3cd6b216e8b82554eaa2f6c45b0a3c14: string
  col_29b35b7caf7d5ae4d43b9b80ca0f9187: string
  col_efcaf7b2db6ef497a009d28351e75abe: number
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table3527de031c6623c0eba6355dcdd45a6b {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_52acd46049d4e8c9c8596637256408f5: number
  col_65a3660424a0ab0c1ef22059940bd5e8: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_98c9253c0973d0e076532038838b0ad9: number
  col_a0108f4039ad5ef8af15629186ff5d13: number
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_5607e33e4ae68a12af15c4fa9ada5c93: Generated<number>
  col_0268179270db272c8d70e400380d7c05: number
}

export interface Table09612d694974820d8807b91ecde8f26e {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_5d4dc010ae24f1dadd43aa67593d0f7c: number
}

export interface Table38195ba8de22a862c0f40f70ebec25bb {
  col_36c8e89b7e4cfc448f69c971486cb123: number
  col_4f1b7b2483b9bb0a8b355ef69f09d65e: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_34e7aea5cf0f74ee76b3f5445a3ac1cf: Date
  col_c84d2025f9e13529cf7b4aa05275bdf6: Date
  id: Generated<number>
  col_97ec9689eca8dace826b37d2ed59250b: number
  col_3f9be60473c4a309579563a7358c92f8: number
  col_83d043db4fdfe6882fb7f01a09d92b11: Date
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table93037210a648b88105c5ee2473337821 {
  col_46df0ccd51bb26538db287f8e4e6e4dd: Generated<number | null>
  col_f32428508672211d04f041977bc90510: Generated<string | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: Generated<string | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_e245eb517472187d10441eca2c4a9aeb: number
  col_4bf016b629fc04e08a3080d945fff2e3: number
}

export interface Table0b5857bb9e98480275f017b7af173e3f {
  col_72f96160fd66ba04a6c4d17116faca2a: number
  id: Generated<number>
  col_6eabf912118c656e74717bf86ec69f73: number
  col_32a8fa725b782b014f4fff3183a2de16: number
  col_4289648e222b26e875a681db53d46c71: number
  col_923c1ce4be0acf2cf56890bbd41ec804: Generated<string>
}

export interface Tablef27ebdbd2754995818491c1018692ce5 {
  col_1d726898491fbca9a8dac855d2be1be8: Generated<number | null>
  col_fe7105552b616f510178c40c861ba761: Generated<number | null>
  col_c5b4c43869f38cb5e5ca94ba8e823f70: Generated<string | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_b170288bf1f61b26a648358866f4d6c6: Generated<string | null>
  col_de2b14ae7499f90736fc4a92327553a5: Generated<number>
  col_53ca581ab7a5aef5b659bc27c81d5d51: Generated<string | null>
  col_2fcbb818ea112e40bf6f722d975e231b: Generated<string | null>
  col_1840e20d17569bbdcae6da23c2d4efa4: Generated<number | null>
  col_d538cbec9201a31573be8bf3b9e0e331: Generated<number | null>
  col_a29ab34fee08d552ceddc06095b0881c: Generated<string | null>
  id: Generated<number>
  col_84267f80102ea16f25ffe6f5be92255e: Generated<number | null>
  col_c55b5208e65984aac86ada39165d9d62: Generated<number | null>
  col_c2e6b054ac1da5187e54d089c9065cad: Generated<number | null>
  col_169ab89ce8908eabce9ec3b6c5350b3a: Generated<number>
  col_6fb9b267c35b1007e304854b2349ed7a: Generated<number | null>
  col_ff89eee0bc7c681adc9bc0c956a6e018: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_e245eb517472187d10441eca2c4a9aeb: number
  col_d8b2388384ce4e4a14053e9e3c6defd0: Generated<number | null>
  col_6c2d1e1a5e7c824f93773960c28e09f0: Generated<number | null>
  col_4e3f97631a05a2833f3a08434a1677d1: Generated<string | null>
  col_b53dab55eaeda66574268ffea2dd4da0: Generated<string | null>
  col_502fd6332679b81831dba4f9517a555d: Generated<number>
  col_85b27642c10d4a6c72c3b6b4d02c8d4d: number
  col_3b571dce50f96585528355c99d1c3479: Generated<string | null>
  col_1014c2beb9f5ef346656f1056d0885ed: Generated<string | null>
}

export interface Table6009b7b4db0ba922eead74b775f40f8c {
  col_066a120fe3abe924fdd105d2073b3a64: number
  col_aa0ae4d63455847b0b02a481f9f38ab7: number
  id: Generated<number>
  col_b6492f8aa398e19ecf4295c9aaf0e72c: string
}

export interface Tableb6b0fa946d389417c5c3f14aa8ff718a {
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_ca2f68c7e7befa1bb272d18ca7a4c73e: string
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table3edf238f7262a23abe0751a2ac0af6ff {
  col_f32428508672211d04f041977bc90510: string
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_9de9baea781a4571ef4ec283c5bfba6a: Generated<number | null>
  col_4649c587e02b1a41f7eb4967032e10c3: Generated<string | null>
  id: Generated<number>
  col_6ded30065c525d1945f38fc1b77df3fb: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_885fa91590a5518eb66fcca9a6f11849: Generated<number | null>
  col_9eed1c8dafecf36e8f11783f0f9ee8d3: number
  col_910c87c70d93d69a64538ffc358a99de: Generated<
    'Deducción' | 'Otros' | 'Percepción' | 'Producto' | 'Servicio'
  >
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table55ac07dee59e4a2d00136b025cc01d9e {
  col_f32428508672211d04f041977bc90510: string
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date>
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date>
}

export interface Table09e8ea41829a99131a2920761d339204 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number | null>
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number | null>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_dcd12b62e76b17d69e313b8897f4f7ea: Generated<number | null>
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_6ded30065c525d1945f38fc1b77df3fb: Generated<number | null>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Generated<Date | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table7a616917b50007f39137fa41d2f51ab3 {
  col_05f720d878e84cf5edf8810ac56f2f47: string
  col_b599f327b0f1350c83e6466016f68dee: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_e3c09cb3d68235ebdf5820c49f6ef2e0: string
  col_e714c1cd11c5b7d1de0c5f6e076020b4: Generated<string | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_3e68cb4bb944a2eb1873d121e2c1da9f: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: Generated<string | null>
  col_032711695edadad1acb9974d043ec642: Generated<number>
  col_ef1e84bf5d70755290854b1d0d60c91f: string
  col_8b5da04bf1aacd462ab37eec2f0dea98: Generated<string | null>
  col_c29343eaf65c23d827ee1a8df41c4c6d: Generated<string | null>
}

export interface Table5d8df59e64a9eeca85daebca610e21a7 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_7db3960deab1cd20d8b5b1f5501f3987: number
  col_15cf093f2ffd2ac39ed7a55e9ff65d04: number
  col_60145e143f1a86609b62f248f3001b9f: number
  id: Generated<number>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table526124c9359353a7e56271d12d9fcf0c {
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  col_335290b198cde5bc8fcea40f61749ec1: Generated<string>
  col_f8356769c300813cfa84768123cbe45a: Generated<string | null>
  col_7426b7174c1b7d22061329a60b94e63f: string
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  col_4be00234d2a8d9d5271b91c49e484dc9: Generated<number>
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_9f63df725d4f28c580e46c10f2df8a03: string
}

export interface Table6bba2bdcbf233fb7649d1f614417da41 {
  col_7844a93ad4b97169834dade975b5beff: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_8495897860c0b6e16a8d5c7a149d9d7f: Generated<Date | null>
  col_1f6ae20514b228ff1f188515cde39b4e: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table390f512e2274731b2d168d8f19da171c {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_80ae6f72f9c170f9e1bcae48c1677802: number
  col_5ba4f2b0c4324a2a400b0ae7224889c2: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_a67abae8eff833edb8b78a2ded44f0b3: Date
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  col_e9820863f3ff0a31be16598cc3058d78: Generated<number>
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_2371c6548aea76f2e1ac529a3543b7b2: Generated<number>
  col_966c0adb6eb8c16d11aacb1b968763ed: Generated<number>
}

export interface Table1899f801ed13e5910d18c6b08028d7bc {
  col_030b50b01f2428db7db79395842e60de: Generated<number>
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_7364a488f431ca7296b76a34417395b4: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_ec9fee4cc043466cd4926f8982fbc146: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_fb1ecce130681efa10fd55197773267d: number
  col_2a8da7b65d4d1b4f0cd0a3160b6706db: Date
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table1082c28dec8a8ffd8ce641335442372f {
  col_b0ad63f3936782807cb0b2b171280669: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_62bd695be89e0f07c72268b40df9c2db: number
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_b7f9bf58bcb05c0cf59083ffb79e366b: Generated<Date | null>
  col_7426b7174c1b7d22061329a60b94e63f: number
  id: Generated<number>
  col_cd52da97b57b116541458d23792b0f11: number
  col_1d119125897e514751e695fab638cf81: number
}

export interface Table72909a5ac37995f967b619c9cafa07d6 {
  col_d109701b76ff710c8e7fddd648466bac: string
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_8b5da04bf1aacd462ab37eec2f0dea98: string
}

export interface Table81a2bed79d9365d1982e76dca5a676bd {
  col_7d00e7af094c860f729814df43ab537d: number
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_5ba4f2b0c4324a2a400b0ae7224889c2: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  col_e9820863f3ff0a31be16598cc3058d78: Generated<number>
  id: Generated<number>
  col_1cbcac9ade6914a00f55838acea44222: number
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number>
  col_42efda2df902eef7402eecf653a5e144: number
  col_2371c6548aea76f2e1ac529a3543b7b2: Generated<number>
  col_966c0adb6eb8c16d11aacb1b968763ed: Generated<number>
  col_8a56730bf7a7298784c796e101f92d75: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table9b567a9f0bdf26ccd8202eff33ff637b {
  col_6e6c2420ff71849263a56ddabc5a1731: string
}

export interface Tablecb69558ad9c32a83ec1e61169d89de2f {
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
}

export interface Table69cb4926463c11065ab61382047dd490 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table3d90cba85411f05feed564dbcd2e6e55 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_aeffdc77f4dde5fd265842bc848e92d1: Generated<number | null>
  col_10c0a78ec67f5765bb129e53d403a805: number
}

export interface Table32254855b1a9a81426acafd370a0edc3 {
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tableccc5e7a07cecf45f43c5c4efb6bbcd8a {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_6dc961f33219b65a0c2a9287c4565f24: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number | null>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: Generated<number | null>
  col_9d5c513c42957815f422347ca6268eae: Generated<number | null>
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  id: Generated<number>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_145e62065965d2b6e7190139880f1bcb: string
}

export interface Tablef9ce3585ff20a0b1dd731bdd34cf0ad9 {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_4c349d7184176bbf16b24181c7d83b03: number
  col_697b738640d40c3284f56dfa8de48189: Date
  col_1561c874fb6b23d0cb37194fe3d8f99c: Generated<Date | null>
  id: Generated<number>
  col_6d2b226b7f4e0e1fbb6ec47efc9fee7a: Generated<Date | null>
  col_9a115ebc25a0a303b3ffee1a7437146d: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_ded1e7d25d95c7702086a588883f1a40: number
}

export interface Table1e275afc8276112b99cfc6f49842958c {
  col_754b198717fa5cebdfd613f47444b7b4: Generated<number | null>
  col_86a5806c9362be2f139e52bcd5e35d54: Generated<number | null>
  col_6fbe4a892ea3ffb941c0ecf6176cb249: Generated<number | null>
  col_00970b22f199c1f1097c435cdd756efb: Generated<number | null>
  col_50c315b1fbd8484b7d31c7bbba602733: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_707742b6518f4d5b912446969bfc2288: Generated<number | null>
  col_314858149774214e5c87f0dc2de8a7e5: number
}

export interface Table24139be0f90bb33600380f06b12b7f1e {
  id: Generated<number>
  col_663662bf9e825d1b24e8262136d58845: Generated<string | null>
  col_eb6047359d3711dac3175270345f5c3b: string
}

export interface Tablee0ce7ca1270b4541c302833574025ff0 {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_1c732b74da092461cf485a899f72089c: number
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_aff776838092862d398b58e380901753: Generated<number | null>
}

export interface Table129722fe7124ca893b45b3f11aa2797c {
  col_f32428508672211d04f041977bc90510: string
  col_c2673967f655e97fa0e3f979f0af8bc6: Generated<number | null>
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  id: Generated<number>
  col_e245eb517472187d10441eca2c4a9aeb: Generated<number | null>
  col_2af39739cc4e3b5910c918468bb89828: Generated<string | null>
}

export interface Table361ca453b125de0694d45757ce574ac8 {
  col_ed9174294dbcdc54c009c8087f24fd4e: number
  id: Generated<number>
  col_0511961bf51aa24c76ca49e18e4395e9: number
}

export interface Table682bfd8f39f1d3c2f141f8d1bfaba332 {
  col_53ca581ab7a5aef5b659bc27c81d5d51: string
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_e245eb517472187d10441eca2c4a9aeb: number
  col_acfd3b262b59e5fc131811193f9fc57f: Generated<number | null>
}

export interface Tablea4885bc4409d5d6aeca7a333deb32f36 {
  id: Generated<number>
  col_910c87c70d93d69a64538ffc358a99de: string
}

export interface Tabled0b3106159632181125a90621e656efe {
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tablef8d58e2b9ad74400d9d3b73e1c56b24c {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table7f3edc307df1ebe46a26c3cdcce01825 {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table4cb9cce2545216afbbe27fd7f598670d {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table075be2c4bc1569d9e2a0f43c706845cd {
  id: Generated<number>
  col_146c07ef2479cedcd54c7c2af5cf3a80: string
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tableb0475c12dae1800e6f9bed0ecc74d8ac {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table9273711f2c37ed469c438c6e604205ad {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table674852753d920a7b8c85e3d7f0741d69 {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Table93fcd1b734496b580b42aff395ed8deb {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
}

export interface Tablee8de821cfe0519477927d4aceb53aedb {
  id: Generated<number>
  col_454ff479a3b5a9ef082d9be9ac02a6f4: Generated<string | null>
}

export interface Tabled97726553a6203a2e1fe24edf923c1bf {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_72f96160fd66ba04a6c4d17116faca2a: number
  col_7e53ed5979e336b304b1d25f30e1f246: Generated<Date>
  id: Generated<number>
  col_024c93b9757242c6dd6b55cd2d0dd019: Generated<number | null>
  col_9c10dc3d09f0912a7e8dc3a34d7f4cd7: Generated<string | null>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table10a7b3d08bae6a280681dd4b1b4d03ea {
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  id: Generated<number>
  col_b1dc1e3377a082304d817664243e7b17: Decimal
}

export interface MyTable {
  col_6f5e1903664b084bf6197f2b86849d5e: Generated<number | null>
  col_1d726898491fbca9a8dac855d2be1be8: number
  col_aa4ec89520d642ef7dfed01d47c97c02: Generated<string | null>
  col_2e66a5c7e24d1d066230f368ce8b094e: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_4d742b2f247bec99b41a60acbebc149a: Generated<number>
  col_af4e225b70a9bbd83cc3bc0e7ef24cfa: Generated<Date | null>
  col_4f84013a8b5e4c2b7529058c8fafcaa8: string
  col_40e8a963a35b093731af6c3581d35bd2: Generated<number | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_454ff479a3b5a9ef082d9be9ac02a6f4: string
  col_286755fad04869ca523320acce0dc6a4: Generated<string | null>
  col_164b7896ec8e770207febe0812c5f052: Generated<number>
  col_3917508388f24a50271f7088b657123c: string
  col_6f7a0a5f582c69dd4c6be0a819e862cb: Generated<string | null>
}

export interface Table5e096b65e80874785e32076304380404 {
  col_033f9699cf99d7dbb6abab6ddadb5984: Generated<number | null>
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_de2b14ae7499f90736fc4a92327553a5: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_9d73dfc1b706d61e28cf50df23ad34be: number
  id: Generated<number>
  col_1cbcac9ade6914a00f55838acea44222: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
  col_83f7d7a27d3135c03186f950e68e1f50: Generated<number | null>
}

export interface Tablef3ed8107e22455983dfec1061f270c5b {
  col_2f76db193eac6ad0f152563313673ac9: Generated<Date | null>
  id: Generated<number>
  col_d2508118d0d39e198d1129d87d692d59: Generated<Date | null>
  col_c5cfca6ce5a95940c658d8d972f0ba57: number
  col_cb1fa9fed74f1879504442547a142c1d: string
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tablec051ae09c6cf6d7d3ea3732241b7ec9d {
  col_5e0ed9fb00ecd0c6dd65a18eb7e113d1: Generated<number>
  id: Generated<number>
  col_d8549244769c9dc8a8cb8382a54feace: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table58d873381dd856073dc8af727f75a83c {
  col_a538a4b49163b8abcdcff07958d6290c: number
  col_066a120fe3abe924fdd105d2073b3a64: Generated<number | null>
  col_08114ce1193bf6826c3277f27236a6d8: Generated<number | null>
  col_4f1b7b2483b9bb0a8b355ef69f09d65e: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_65412d203d0de8b88fb8688cc686a44e: string
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  id: Generated<number>
  col_6ded30065c525d1945f38fc1b77df3fb: Generated<number | null>
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_5607e33e4ae68a12af15c4fa9ada5c93: number
  col_a7d0a8fb2a80ce50003c37428903c871: Generated<number | null>
  col_d721d91f1a957bbc273b111830ea9355: string
  col_aedc0cb96fca54b979311e9caaf1345b: Generated<number | null>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Table2efbbc557d528fa0179d8200f20bd375 {
  col_066a120fe3abe924fdd105d2073b3a64: Generated<number | null>
  col_08114ce1193bf6826c3277f27236a6d8: Generated<number | null>
  col_4f1b7b2483b9bb0a8b355ef69f09d65e: string
  col_2f76db193eac6ad0f152563313673ac9: Date
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number | null>
  col_c010021498d7345dadc4ec5be041f8d2: number
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  col_33cee772b203aed80ee06d3dcb2cbcd0: number
  col_35ccfc3446d7aa0609cab70e86d2b448: Generated<Decimal>
  id: Generated<number>
  col_9859f83dd80f56deebeb616b6b575ee3: Generated<Decimal>
  col_1cbcac9ade6914a00f55838acea44222: Generated<number>
  col_6ded30065c525d1945f38fc1b77df3fb: Generated<number | null>
  col_b114935b452a2d927bd5ac81ad9a3d67: string
  col_d2508118d0d39e198d1129d87d692d59: Date
  col_fa367b08ef9acfa2b65fc6150dee916f: Generated<number | null>
  col_5607e33e4ae68a12af15c4fa9ada5c93: Generated<Decimal>
  col_aedc0cb96fca54b979311e9caaf1345b: number
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: number
}

export interface Tableb1c2cd01d00c7351140f576d84e64fc1 {
  col_7e53ed5979e336b304b1d25f30e1f246: Date
  id: Generated<number>
  col_fa367b08ef9acfa2b65fc6150dee916f: number
  col_e245eb517472187d10441eca2c4a9aeb: Generated<number>
  col_b1dc1e3377a082304d817664243e7b17: Decimal
}

export interface Table173d3cc6670ed190157f57b6fc5f789f {
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number>
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<string>
  col_a7f4797b61012da3a9c1a8049c8a4974: Generated<number>
  col_6c58e53058059892b26b3562a7fafa9d: Generated<number | null>
}

export interface Tableea7fc406759eeeabe58177f5dc5b2749 {
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number>
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<string>
  col_a7f4797b61012da3a9c1a8049c8a4974: Generated<number>
  col_6c58e53058059892b26b3562a7fafa9d: Generated<number | null>
}

export interface Table5d31333676303c399518c2fc4cf6ce6b {
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number>
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<string>
  col_a7f4797b61012da3a9c1a8049c8a4974: Generated<number>
  col_6c58e53058059892b26b3562a7fafa9d: Generated<number | null>
}

export interface Table411a4da56c483124eeb78d27496b6bcc {
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number>
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<string>
  col_a7f4797b61012da3a9c1a8049c8a4974: Generated<number>
  col_6c58e53058059892b26b3562a7fafa9d: Generated<number | null>
}

export interface Table90b86be76e1fe1dcbfeb23aac1268f60 {
  col_80ae6f72f9c170f9e1bcae48c1677802: Generated<number>
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<string>
  col_a7f4797b61012da3a9c1a8049c8a4974: Generated<number>
  col_6c58e53058059892b26b3562a7fafa9d: Generated<number | null>
}

export interface Tablead803551807f7dd640a7431281e60024 {
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: Generated<number>
  id: Generated<number>
  col_0169d667d30453fc6d348ede68c6137e: Generated<number>
  col_2371c6548aea76f2e1ac529a3543b7b2: Generated<number | null>
  col_966c0adb6eb8c16d11aacb1b968763ed: Generated<number | null>
}

export interface Tableacd9c0e145638abbf38c6c9982b5d978 {
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_0169d667d30453fc6d348ede68c6137e: number
  col_2371c6548aea76f2e1ac529a3543b7b2: Generated<number | null>
  col_966c0adb6eb8c16d11aacb1b968763ed: Generated<number>
}

export interface Table03d5e3f6a5a1305f36b6f5e7b40f8607 {
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_0169d667d30453fc6d348ede68c6137e: number
  col_2371c6548aea76f2e1ac529a3543b7b2: Generated<number | null>
  col_966c0adb6eb8c16d11aacb1b968763ed: Generated<number>
}

export interface Table1ad14a94caab8e7087a497085d7136ee {
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_0169d667d30453fc6d348ede68c6137e: number
  col_2371c6548aea76f2e1ac529a3543b7b2: Generated<number>
  col_966c0adb6eb8c16d11aacb1b968763ed: Generated<number | null>
}

export interface Table13e2dfe71a6146bf0f7286309cee804f {
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_0169d667d30453fc6d348ede68c6137e: number
  col_2371c6548aea76f2e1ac529a3543b7b2: Generated<number | null>
  col_966c0adb6eb8c16d11aacb1b968763ed: Generated<number>
}

export interface Tablec227d3e74b291218da01d96ad8e3cbf3 {
  col_b44e675732d485b4ded87fd63200ab77: Generated<number>
  col_c010021498d7345dadc4ec5be041f8d2: number
  id: Generated<number>
  col_0169d667d30453fc6d348ede68c6137e: number
  col_2371c6548aea76f2e1ac529a3543b7b2: Generated<number>
  col_966c0adb6eb8c16d11aacb1b968763ed: Generated<number | null>
}

export interface Tabled861babbb2f5fa7cd7537704e5000a83 {
  col_c010021498d7345dadc4ec5be041f8d2: Generated<number>
  col_739f751f517ccb895cb948a88ad78e43: Generated<string | null>
  col_1a1bd05bcd142859a62686952940e09e: Generated<string>
  col_b0da1cb2ad234bc279511b1fb66f6fbf: Generated<number>
  col_07b081464f537fa90b1de74e33d9f823: Generated<string>
  col_2b9cb9ef1a2977920c1ffd5df4bd4817: Generated<string>
  col_9d73dfc1b706d61e28cf50df23ad34be: Generated<number | null>
  col_b29a1ebd32df20c0b7928f43baa738ee: Generated<string | null>
  col_1aba85bbebef5ff4eee2f59cb2d9d7b0: Generated<number>
  col_0b683b909d42220ecd33ed3752ac705a: Generated<string>
  col_1e8e291fd8d42e9948004ae41f09dece: Generated<number>
  col_4241cfa1d3605ca1ae3b0559e88e1eb2: Generated<string>
  col_aa6b7c7a9c7a177e3f1ba452783eb63b: Generated<number>
  col_93fbfd598e9de1272e10942d7a5cb6ad: Generated<string>
  col_13a88bf9e5fc7bc33fd7d95a8bce65ba: Generated<string>
  col_484ada59e3bc5009053ee3de7238e81a: Generated<number | null>
}

export interface DB {
  table_87d275947b3f2a646cd8ee94f591ef86: Table0ec723c3d4ee7229ffba2a11539b0129
  table_cc84d0da913ff5e201cd2498cd11bb90: Tablec67d8be002857dd3a70a2c4edaa4671a
  table_49830d6d58c2b4f748ffc67b8b96d2ca: Table3face097074d5d4ea47610accdd3ffc1
  table_808edb85a0b912066126738aee81e217: Tableed617265d2d72c8e748ff8796bfa04c4
  table_53425a83056f97f81ebbed0e3a7c3de9: Table6dc0e4bf3b08bdf7391e5d833d1673d6
  table_736d84cc80e257dc78371b1eb0fb6b20: Table2f01d1d7b29ae047871b62964df1ecc3
  table_487e1ea19a552a812641fce4b25ca0e4: Table9f50dbe0b662b9cea0d016836eb72504
  table_a54c27458b6b5713e6fb731d2d54c2c4: Table4b8e90e811d962e132f9550bc90d5443
  table_ed9c00f680d2f0160414e2616694a04a: Table0ae6c699b7b44b166093c052150a0d36
  table_9996a55495fbffd1989dc4542469aaeb: Table2e45370c867ddf8f0ca7710b63dd2746
  table_426cfbb1cb47118dee5d9aeb9ebc9811: Table19f57540d944441abc6dcebc976adf96
  table_e5cf1dcc3993bf7c0ca2ce7e2f1260a5: Table1d1b84f13a74383d5b0324a011b609c6
  table_c5a8b59778733a9ed1ff55b76feb5aee: Table42dbaa8105cb92599360aa5169283403
  table_4f88999bf83d95515d96be5a0060a387: Table2f81c25612f8fefd026b753a1753974a
  table_e0290dd8ecb360c47044a3a2a882dd6f: Tableded2bdb12664e58a26152ebb5fe676bb
  table_2fec9061cff5d6a33870e59fcdb06c31: Table23e7a1e5ab953d2a85a5958458d0d824
  table_aae67cbd807d09b0d66e062e70f886dd: Table41bb6a93b802fe08f0b054ae835e2fe4
  table_d1bd6a4f6d21595e92f85d647b668e64: Table8be6c29eada2e2ef68bef0c9c1401a97
  table_8be60df8bd508aa3b21a02c30f2d540e: Tablee91e54a2c273ec3221b4d98ae8d79d12
  table_a489899852f5f4a4a8dd760a53cadf3f: Tablebb08e5d0fa8fd6089eeeb1ba950944a1
  table_157a3bc9c27097f32f4faeb89768cfb1: Tablecaf406ab258ff4b54413265206d55b45
  table_975382265709d29c3f2442e3bfb74935: Table90ffcbc2bfc57b68acac037b0aeae3d4
  table_ecaa5c884efb077761e66b71833b253a: Table1e2c9919a848fb2673ac28780aba041c
  table_6c06b705ee850005c02ffbe38262ef25: Table1c765aad5af6c98fb0ef475fadda911b
  table_1b322cd0c444c827dac7f30ae058a2be: Table4f240fba2b420e220c97e6e14c4819c6
  table_3ae4d1acdab97e1ef170f779f41ffcce: Tablec97e3cdd896ff553853d7817e4a866e2
  table_4a9207b1eeb4f40952b69f3479a48037: Table4974bbdf9d728fb538d7507cb9f84842
  table_610862f4ec87086144fc1485e6838505: Tablea3c8286fc7df926fbf05e09a03e2ac77
  table_fe1a1676504a5a83e3fbf40eec955a58: Table39bdacc8b55267ffc8bf75ff8ec564ce
  table_9d71d7aaffb66d31bc2b9b42a8ff2edf: Table3d68aac4deb5f76aaffa0df8c01e305a
  table_6c94f280d7ed171b4ae6f181c9731c34: Table90a64fc3cea5bc905374973771cafcd3
  table_d8dae30aa04afffe6c328708f46ec44d: Tablec479a580bb37024884d940eeacc9c4aa
  table_9c3e72d53ff7007af15c6f696fb71812: Tablef7d7a7557d9db50bd40fe14bd830b9d4
  table_81985582f225312b575afc02878085dd: Table1d62a6c4a9763009cda042181b0c48af
  table_aa3267f05fecf061f13699e786a51f9e: Table916f65bd1433290f26613ccd976c68a7
  table_11ede743d16afa28cc84bbeadfaa538b: Tabledb34593d7377d2007d44ba4b47dcec97
  table_af0437a4a6189de08d668a2d0ce97b54: Table309c66af6ff8ccb2dcf123e1af40c9c4
  table_98573ae89696f94f48a44b2b079b64f8: Table8921b63f9cb21e8293a8c1ddd9edc866
  table_7980538dcc93de25b4d83b4b3261ed3e: Table2037e68416ae40369fba0a939e7ac693
  table_6d3142ac2a560a1c5c32e699f81bf7ba: Table2b3f160083004c6c92a2ce1faf87067d
  table_b37880f0bb08f83da5de92e1efa19943: Table5135075fea7b2d1c93603df216620907
  table_59aae399ad0526272d45ea6c030d0daf: Table5d4433ff31ef75511e70aa6e71495afe
  table_6fbe4a892ea3ffb941c0ecf6176cb249: Table9e258b1708bd64e877d6cca1467dee66
  table_fd70d2cc35269b186dc738d8a6ba8324: Table4ed17d356988e97fe63e4b4e3b060917
  table_8d8d4b505b94c6f16ecea33984d5c60c: Tablea95d291bccf0be8becb18282bcbf93a9
  table_fe15a427dc1402f37002fb019dcb3607: Tablee12f5b7476cba16c3b1480cd551d2b42
  table_e36a272a216738299e30a9823c9b0502: Tablea6ca43be611a38117221fef4c761f97d
  table_977e92e9417068febe7a1207f0ee014f: Tablef83eda9e66948a4da342fadf183e32c3
  table_5f9639fff5d140e880cfe248f297d49c: Tabledfc2f0e19fe1c0e8dd04191a3035bac8
  table_d5c1fdd37d3bf68fe20c43ca4520f7b8: Table93f030da0924f35ab2e57081dad1e2fb
  table_03c2b698e69f760082f5d99cf50fc7cb: Table59fc5666d6be52faaeb255fb48a401ef
  table_2e7acdf58c80018a69ea3ff6d311d5e9: Table29c7f8f8df026c49d8ea3ad088e8780a
  table_5e34805f74fb904a4f6c1cb475154d11: Table2e5e86f744edaeea91caedf4496cd21e
  table_26eae7010f00790dcb9fcea51b458b20: Table27112b32955bc32b3cf3abc78f6041f7
  table_5a7765fcdd3e8de9d430693787b3d7e8: Table6a8129f282adc469ee9233bcf63f20b7
  table_0be8b4549e9512252af1761de32647d1: Table55cda7b389c3f5e26b58e806dc82d6cd
  table_5a161ff0fcf3e07c472290ed26b22b88: Tabledddb567693b67dedccc76feeaf305885
  table_1787f968ce9e996c38ea93516367e7d9: Tableb45f137169628885a5507a98a1fd203b
  table_59aa2c8b41281fdb8918df77e2d7f549: Table4d0fb43fef8f71d027e1c62ff7b83c1f
  table_7c73f0112ea394abeaac85d07c32c96d: Table26d9e67842818bfccbbfca6020d3441a
  table_1c0b897074552cc11aeffb1cd2023038: Tablee6de3a3fdf132b2b794ad9358fe01719
  table_7232d71e7a31c3959d4f9758b01bd87b: Table5bdeb7407d8776f9295b3ae2eb482855
  table_c5b4c43869f38cb5e5ca94ba8e823f70: Table259a82d9d67d1b779666191753027e2d
  table_ed7ed6a3c5b4edbc5cb93ba6ccf845b0: Tabledfcfa50cfe70d46b898ed0fe276855e4
  table_00970b22f199c1f1097c435cdd756efb: Table11e00101e1b2f60d0a2acfcf46151908
  table_a7991c3173c68564fa7034c40ed76e50: Tableaa828347830464c8d6fb6070585f8786
  table_81342351d9b0750a6a1867e61a69f57d: Table5e1a250360f2e59810faaec5dec74bfb
  table_20453ddb146769fa6cfbba4518a94e35: Tablecb67af6a70220cf4b2c4e1121d9351c6
  table_34062ca76ff4de600cd82d2867d743d5: Table01687ac6f71bbab86d7fb8482bf71301
  table_5bc008425c0529ce7f1bf46b23bb12df: Tablee4612831426584576f2d39997ccac9c8
  table_44b3b2fbc1525a37fef79e3ac36ae137: Tablebca1b3f3c2526216b2f01c01fa85f3f9
  table_ac000b4f6f0f6a63f812a54a2fc1d54d: Tablecac2eaeb16e94e019e7e98240c4bac17
  table_d9240bae841332419073d023ec9d7da3: Table7eb5460a0c6690c1dff53fe4940240db
  table_7d2894dd74c1eb98e683d83cd9f5e554: Table5c88bed5704d2054a84d44150bf10f21
  table_3c21e15fe7f88da04c6eb6546f1f0c45: Table148eb9256ed9e01df75e345bd7e5c9f7
  table_1f2e67e4f6060a2f4483f85e11e9a4a0: Tablee2c77a8b952bdea3bc2cb7261168ec45
  table_9eaad0288ab657d15b0b89a9b118295d: Tableabd2380e09dc7a608bb7e5c33654540e
  table_1a1463b3e26cc157b5bbbb8fde616025: Table7117bf3bff290101f4fa6d6de627b58f
  table_7349c3b05f3dfb291a9a73aecd2d61a0: Table202a1f7684d2c58afd3885112de82158
  table_2e34d0c29c1107b75c385543999c12eb: Table93aeee94c0d8d4e08a56c97185d68ae7
  table_06d62f58421acbf930a661bbd3ce7452: Table70c085cf2d0edd14f7dbae474f064b1c
  table_aad0e25ecf17545e7bec374e476f9b47: Table2b11443e8af088b453d5119d135803ac
  table_ea23a0a1382ceb403c98dfa1a709b361: Table0a542ca892cb0eea27538d7360f718ec
  table_f84e347fd6617acc6a0f6a8973248874: Tableb8378493b92a26626ae5745222c8ba69
  table_1adc14dc0a7ec969c3e77d40758cd493: Table565a308ecf3782bb5eb0197187361913
  table_292a9ebdda857f983a6fe42a2c434e05: Tablede86128413dcd68bd6d1ca009b6bae17
  table_36992d0f70a50b1b2ffabb5eea57bd1b: Table57dadc25e9a34c53f66b5cb499d75904
  table_268590e60e51ec5d0b870c82481f2b2e: Table366c7f7bccaea5ff455a9b9265448ebf
  table_132d4b3547909bc6256d34163fb57eb7: Tablea4ca5018c98bd7912524f97ccd0a8757
  table_c7c8d495ce776873a2da62c508138d34: Table402dd89f94d2a88ccdf049224dfc8700
  table_70aaa597ccbbd5cd92d99b1cfa7c8b1e: Table92498a6babb7032cdcad6e43158a3359
  table_028c49ccb95cbef10c800198d6d80928: Tablee90356817b37536144c4cf962e9e5165
  table_3d3048db19a6783cbcd9a6ced2755859: Table61a79fc440f7ca2d4190d47ee809f66c
  table_b900a90f5f896392fbb4c9055bf75465: Table7051320fedfb456818eb15cdf217186d
  table_c1beb04a7642970cf4e59164d0b162ab: Table2d7cdf1ccac4544f81ac78a12d5fba7a
  table_8cdd0973d9ca586415d14a8f279149a7: Tablea8e3bfebcd001eac1185867f7dec94a5
  table_50c315b1fbd8484b7d31c7bbba602733: Table148ce21c70970d2809c4028c229445be
  table_a4492608b8eebc6dfc51867d1829953f: Tablef650c769203b8bd7eed5a8b7e249c0a5
  table_46cb140f325195b7e28886910ba67990: Table8b9070a970ee019dd472ce6c4a08418b
  table_ae8048f57d533f1206ddaff81f6258d5: Tabled580c05f239408ff0392e235078a0ac9
  table_dad30ddb3ecff3c395383e834f041676: Tabledd7d780df70068dcb36a8d8b86bd5298
  table_d6303bbcbeb3da317670fbb8167bfa1d: Table48df920caa8cc60fd47820e9d94ea940
  table_6611f9ee209aef523c4dcde78383a3f1: Table9bb0301f7ca02953fac2add8dcd7630c
  table_8d9107a07a519a3e02e2ce5e0f68bd8b: Table5492e76278a71210d7231f4bf905ec2f
  table_9c0640720d7b649f506ca4860e443f35: Tableea8e45026529937b0cecd544d8801cfd
  table_ab478c8f5bc3681081805bcdc6e4d0c5: Table574ff9acd571619424cd55716f5f1dfb
  table_92917d401ca6fb8bf405fd92c407fc13: Tablea79aeca54482635868f02356a51fa369
  table_a68acda553f5f089df441d59eeff1d9c: Tablee7a44a84d410fa64377504e3aa7f72b6
  table_99e321b176fbf3589a92e6084f6c14d4: Tabledcc9250fc52d5fbc25a56cf9c4089073
  table_7518c800f93e5459daa1ff73c7fba821: Table4d82bf6c52ed1355768c73593994c5c2
  table_49781987f16dbfbb517b355b5e7f82b9: Table73f359bc2658d254af39135aed8c3bf2
  table_76d040ce360ee5b120a40f7066084137: Table8cf85c63dc3200ef8145fc0344d00f16
  table_e89504d58e9f3da99aa4c0e6c4284088: Table401ef7ed8ddaa97932ede0de0b157c04
  table_5ceb5499052a2078ef4fce93f69467f8: Table3e875ede7feab48a89082e0c87c364f0
  table_025ad7e58da04ed8536959ba4103b6ae: Table7822bcc86140bf34bc6cdacbd734c0ef
  table_312cefebb95f0e122bc9915cc4159167: Table459dc31349051f20a755552adaf60c81
  table_fff4c6195261874920bc7ce92d67d2c2: Table1b8610f190607dfbdafa9c71f72acd43
  table_02bed0f193a8ec672c01e4c7da096850: Table1edc1b921ba66176c3ec62961c248f78
  table_a5fe391b0937a21fdd489d49b271167a: Table9b72afad4afd63d81ab6ef56c926765d
  table_17f5074d56437c231c6541a447d3ec23: Table309e0b9a80a4ad911a672f7174429e35
  table_1d97d2be8972551ff4d686c373055915: Tablea0eb46b195e5cbd5e85384a9a1622c14
  table_7025bf2bf5e2e0d6a4487fc0cfbda364: Tableea5b8f9c56ff4ae4cb3c8f22541b33ba
  table_50b53baf2b58394268ae89bddaf7c095: Table3a87f98012aa2362e8eb64ed4d9e8f65
  table_50430e0942ebf25480aa9da4b89279bf: Tablefe2e32091534caf00911fc7435cbc97b
  table_86e46f16f4e6a386a521c67241d2d42f: Table3cdcee0d77b622e8a2ec654a21270877
  table_a697494b3fdab0b4e126bd3a64e9f9c7: Table8077f242ad5e05394a3dd81ce79565f7
  table_6e128f9931a1632c258c1281fdf4636e: Table52a8644bfd17799495525f2fd8adc480
  table_b43f07de70bf895db779f5f97cb8d105: Table74bb684c41a71a06f561e10ffa4e3323
  table_dfdf6321467f7b66dd8ad7b08e1d54e1: Table64ac7b9a171e9af222924b693d44887c
  table_6c334f6291be7fa62a9aca0feca9da96: Tablefd230cdd0c0d7bc04b06cffa3bc3fa3e
  table_d4391454b38c50461bc8606d5dc6e203: Table2bf8003c7e2a7344f4d30c3a351926c5
  table_d35939386c5c0d22ce7f7c32e8646e0a: Table5c1f23359d009924d75dac9200da99ab
  table_82a555b6d488646ce24524e71bb056f5: Tablea6cdaf7c2c1c27d8389fb8ec7831b240
  table_bb0744a0bc7973cbcca7a79bad78451e: Table618b14672aa41a4ddbaa07b4668e9ceb
  table_707742b6518f4d5b912446969bfc2288: Tablee0ac1a12db533e45722bf75854c5f68f
  table_99ebe26a1b9b9b2bf0ae1e00435dbebd: Table6b64130a9ac5e9179051a15684e76956
  table_0f9e8815806e611d4c51af6a6e4f1a0f: Tablec3c4b9ba46ff23ee52e9fa59ba4cbd42
  table_81ae6fb42f5779dfbad0a06795277f3b: Tableac8f964f7407177bed83d5a1b563c4be
  table_ac0e4fab912414bf6c4d82ca5e679862: Table0e3703752e6fb26a7c95ffbf9ba62354
  table_6cbf92b1a3e27faab6982aafe47bc0fd: Table051ebef2507af0ef791ed665f9df9f69
  table_ffd3383867c4ae4d8c200d3c09006427: Tablea85ed4b894e81fcae5b5f32832c0a4aa
  table_4566a5569c4fa2c2ba07bfa6b8397135: Tablef2e554fc6e599ca882cad3f9c8944c5f
  table_8bf9d631744222f061702b22effbed68: Table92318b69e7164d55b1815a563a4f0fda
  table_fe3fd6febea537a97cc193cfaef7aa05: Table11c3ad790c98516ecb794068e8fe4332
  table_af3d9c9d6bb7af18c920bc8963996ba1: Table0b9fd044caf91b1c9c0decf463f48479
  table_eab40d2792fcf58cdf6d56df7c676d02: Tablecb5f0e2e2a6bb82fe0ec713f3001adae
  table_81859a5a7cf340e00333e133ee83c6a3: Table05f7a75fd9ce14b6ff3abafe6a0315cd
  table_5b6c09d8090e38e65507dd7138348724: Tablef9d0cc88ca4af2fc064f9fe28c1cae51
  table_1084015020d8bed5c99852780cd060b5: Tabledf515f554daadb410af199b9d2af4968
  table_56bb19565d266b3c5db4b36b54121de1: Tablee7013b1aa66ff80026b9594533e73417
  table_fc8beec5010138f14cac210396ce946a: Table6fc94749b5f65b04e1364bc84a3b675a
  table_b1de95565fefb12c1b5e9ced0c31aaba: Table7e5a6e895e47f444ce7042734df8ce92
  table_7ee33378e7a9581242b177c22d55035c: Table03fcd39a79bd9fbbc8f2f32371eb6a9b
  table_889380bbad7db8828028ff1756840b4e: Table3edc0e801929e10d8dd381561aa2bd31
  table_a89ef28d2e368372d285517fbcd8c8ff: Table75f7cd025a872d2698d2a6e53a8cd953
  table_3176e3c369a24003ab8f6bdeb5e36fb7: Table075f9410d29eaec83d4f68c3dfa82a10
  table_28536ba4b4a961d66303d15d863e9bbf: Tableb91d0a254d43344084dc0efd98b90946
  table_905ec07246a5e10d75f1ec0c71c1cbb8: Table4d4605d2d071f927c338880fcda7b540
  table_649ac5d5790cfd996132f99bcae54699: Table14a5541144254091c320909a95c4c614
  table_9034bb7c1383ffc26a086c9da4db9f44: Table9eb67e79e0e2abbb0a295904fd81d805
  table_5cc5636d8577bebe57cb65d9f80ccf60: Tableb16695c526d6fa5e20b329d5eabfd364
  table_943bf2c7f95a1de4c96d117762255431: Tablea700a17706246884b5a04cafcebeaa55
  table_a99e53e8b0ea6fb028b8335f6879b541: Table6a853060686c878e7535e29bc3772d73
  table_dbdc90d2efd6251b1dc89255b5547d58: Table2c1e8df56b265a10929de25e4593033b
  table_011ff64548a9d77b1672d61c71b144cd: Table3c8b015b7697cce06653b215afc8acd5
  table_7dd9f7bddf3aaf04099d008f1615d84d: Tablef058a40da08114d390fcea4b81b4f0a8
  table_91ae77857e698e702b1d36d8086e94a4: Tablea6a7b2d92feb037592b7ed49c34d1e54
  table_5e350d0500edbf693ecf31bc420dce10: Table4aba31682ab92f6f2baae3f68f9dc1ad
  table_986fcbfdf73cf8637d5863efcc4a23b7: Table75d4ed2c1cedc7a0f7e36059177a8837
  table_87b2787be746d9af6fa1f02c7174b6de: Tablec3ba8dac5adcbeb93ed2dd458b6ad4a1
  table_adebe9d523b0e904d5a23244df8acc86: Tablee53ad4b421c58913d023a3296c13419e
  table_0e3a2fd2e1be1fb139d982cc4cf27a37: Table980786dce470ebfd2621534ebcd5e6e9
  table_044c3ac3bb3a8f36c94c6914fec4c640: Table1a270e99026f39aaf8e33546e1c2c39e
  table_0b5ac72e03509e06683edcba4b3887ab: Table380b3be3b993931074af40f4e0af76f3
  table_2746d6a0415f4e97db91054eaad8f549: Table4a03b332b99d0dab4e359b9b2e9132f3
  table_c3489d7044badb74bfa78892e5af3c50: Tableb690efdc73ab53d741824e87ddf41a0a
  table_27157dcf07c6222108aee0ad07fc3c84: Table80586ee503601f161507ee3f207fa19a
  table_9616c4051420073951c9dadfe4cfecd8: Table138bb88f13d65a10a42882c2578d7839
  table_382969f15d228ca40eaaf6ae3af42dd0: Tablef8ad778cddf738c853992b7f5446b4f1
  table_ba15c662ce189e01e69a2426db41e884: Table9f6e2daac23f8ae268d4557cb47cb202
  table_ef0c79ab9a79c6eedf5a3738c59b4e35: Table7ff09e5ace1dbf00f39b6358c5aa3817
  table_737ecf944683adc260346e8cc807a707: Table3527de031c6623c0eba6355dcdd45a6b
  table_38773f13c7c7902bd4b3717a240873e7: Table09612d694974820d8807b91ecde8f26e
  table_1a55586b73d1a759c1eadbafd3e87c2e: Table38195ba8de22a862c0f40f70ebec25bb
  table_de936835b986b7e9a72b8706204dc183: Table93037210a648b88105c5ee2473337821
  table_1ae34354f4623d6118be8b39a6c33401: Table0b5857bb9e98480275f017b7af173e3f
  table_b1d00f154cae4b5689f1c60fd746cc6c: Tablef27ebdbd2754995818491c1018692ce5
  table_5dd25bad4af1a1b2e85d63d182300992: Table6009b7b4db0ba922eead74b775f40f8c
  table_d119c7e31c78a3c779aae46a89f48594: Tableb6b0fa946d389417c5c3f14aa8ff718a
  table_1c9d336338cae6fb14a0990bd1c54bc7: Table3edf238f7262a23abe0751a2ac0af6ff
  table_6b6b30980569c916119c335ee3ecd6fd: Table55ac07dee59e4a2d00136b025cc01d9e
  table_c5c92cab080fe1234767a8be5814e634: Table09e8ea41829a99131a2920761d339204
  table_0556e22da4d46d9d6f4f679de33c729b: Table7a616917b50007f39137fa41d2f51ab3
  table_d1b04d199a69310996ab11fa49aebf4d: Table5d8df59e64a9eeca85daebca610e21a7
  table_03fd35f2b6a928e66a8894f914fdeb1a: Table526124c9359353a7e56271d12d9fcf0c
  table_18563b6f693d0c3e17d63aad91681eba: Table6bba2bdcbf233fb7649d1f614417da41
  table_5d1d4bbd5ec1f145b6fe12b78aa0a2ee: Table390f512e2274731b2d168d8f19da171c
  table_c1069472c40f0480a45ee4dee787c4d1: Table1899f801ed13e5910d18c6b08028d7bc
  table_b20ae4cbae25a95b31299dc9033fd532: Table1082c28dec8a8ffd8ce641335442372f
  table_5761eb47c363bdcf7bbf68c1801bf699: Table72909a5ac37995f967b619c9cafa07d6
  table_404d5ee6f26bda1b4be093317b500097: Table81a2bed79d9365d1982e76dca5a676bd
  table_e8e1d616dac945e0ee0d05480ab77957: Table9b567a9f0bdf26ccd8202eff33ff637b
  table_de8db519594b7d21efea9f31260b2423: Tablecb69558ad9c32a83ec1e61169d89de2f
  table_735c26d97cd342c6161c22f66cc99511: Table3d90cba85411f05feed564dbcd2e6e55
  table_cf38d23f2daeff354349485b97299972: Table32254855b1a9a81426acafd370a0edc3
  table_92df6eeac3e4b00edeee9dfe99d6640c: Table69cb4926463c11065ab61382047dd490
  table_fefdea6d099a9810a67b711700a35a8d: Tableccc5e7a07cecf45f43c5c4efb6bbcd8a
  table_a3cb20d19c33e8fb3b00b07fba07def0: Table1e275afc8276112b99cfc6f49842958c
  table_d5db6cc36112076d805e58cb5ec13850: Tablef9ce3585ff20a0b1dd731bdd34cf0ad9
  table_dc93e59ae64c8cdae881b6f25d64564b: Table24139be0f90bb33600380f06b12b7f1e
  table_6efc03d13cdcfd25a9ce3e87fc5456e7: Tablee0ce7ca1270b4541c302833574025ff0
  table_6dbc88c5b052629e050a099e04d7be3f: Table129722fe7124ca893b45b3f11aa2797c
  table_4a4402f5d23fa4f9df3b8bb8e3dc2d32: Table361ca453b125de0694d45757ce574ac8
  table_8e94e6bf050f60606c5da22bcc6bb9b2: Table682bfd8f39f1d3c2f141f8d1bfaba332
  table_170edf3aa8f832f0f36d9b9a0c549ed4: Tablea4885bc4409d5d6aeca7a333deb32f36
  table_8320808a7934e9fa32c17c6499414fb1: Tablee8de821cfe0519477927d4aceb53aedb
  table_ff3ba17c4964fdcaa9d663b6fb483dd3: Tabled0b3106159632181125a90621e656efe
  table_8f9d849161a30cb7431d221283f29c43: Tablef8d58e2b9ad74400d9d3b73e1c56b24c
  table_593cef89801d5094cdd7ad51ea3eb29c: Table7f3edc307df1ebe46a26c3cdcce01825
  table_e021bdbeb32ee1578e7462ebf75dfb7a: Table4cb9cce2545216afbbe27fd7f598670d
  table_2d8fef6ee4574f9180a0c7f593f47442: Table075be2c4bc1569d9e2a0f43c706845cd
  table_cdf7f8adce5092d3805a7526a2551c2a: Tableb0475c12dae1800e6f9bed0ecc74d8ac
  table_ea38a156b8018fa2d1034393d595c1b5: Table9273711f2c37ed469c438c6e604205ad
  table_871b4c9fc59eb1005340453c9936c38d: Table674852753d920a7b8c85e3d7f0741d69
  table_000a8a0cb7f265a624c851d3e7f8b946: Table93fcd1b734496b580b42aff395ed8deb
  table_e868614c9689160521a0f7cd8fe444f9: Tabled97726553a6203a2e1fe24edf923c1bf
  table_eb4b47c599bd30509bef47d1ea3a29e0: Table10a7b3d08bae6a280681dd4b1b4d03ea
  my_table: MyTable
  table_1474a7e0348b1ca363ee4a2a5dc4a1ec: Table5e096b65e80874785e32076304380404
  table_921d1c0613d8e78089f21fdc086c6254: Tablef3ed8107e22455983dfec1061f270c5b
  table_8f856811783bf2c6dc1cd3fafa065e91: Tablec051ae09c6cf6d7d3ea3732241b7ec9d
  table_276c7389f255e47fa56f3db3b7b203f4: Table58d873381dd856073dc8af727f75a83c
  table_f0e61821517de97ae60ce2db4211f6de: Table2efbbc557d528fa0179d8200f20bd375
  table_444765b0f61d176f3e075fcd0aba7ac9: Tableb1c2cd01d00c7351140f576d84e64fc1
  table_7a27c425067f969bf5207fe7646fd5c7: Table173d3cc6670ed190157f57b6fc5f789f
  table_b4454c9867da1740a95d198a0309bb1c: Tableea7fc406759eeeabe58177f5dc5b2749
  table_d7b45912e5ca97cdbb9a13ddeae017e9: Table5d31333676303c399518c2fc4cf6ce6b
  table_ede804aecaaa0ad1a5afffb9b2a0d927: Table411a4da56c483124eeb78d27496b6bcc
  table_18c53fd6b99123cd1d5416c633d1d257: Table90b86be76e1fe1dcbfeb23aac1268f60
  table_3b5daebf6b386d473d143fa615a63b30: Tablead803551807f7dd640a7431281e60024
  table_3e32e29fb3ace788a139de83f6baf360: Tableacd9c0e145638abbf38c6c9982b5d978
  table_6b330a3b9c49a6e7867514797facf15e: Table03d5e3f6a5a1305f36b6f5e7b40f8607
  table_0193342fd1dd6f0d57893e54a6235090: Table1ad14a94caab8e7087a497085d7136ee
  table_c5f1901de2a3954057ebdea18ec92851: Table13e2dfe71a6146bf0f7286309cee804f
  table_b5e6a54f6ffa9f4314e45fcf5ddfc499: Tablec227d3e74b291218da01d96ad8e3cbf3
  table_da9bc7793b7e3784c03d55128145b7e3: Tabled861babbb2f5fa7cd7537704e5000a83
}

function testHugeDBSelect(db: Kysely<DB>) {
  db.selectFrom((eb) =>
    eb
      .selectFrom('my_table')
      .where((eb) => eb('my_table.id', 'in', [1, 2, 3]))
      .selectAll()
      .as('test'),
  ).selectAll()

  expectError(
    db
      .selectFrom((eb) =>
        eb
          .selectFrom('not_a_table')
          .where('my_table.id', 'in', [1, 2, 3])
          .selectAll()
          .as('test'),
      )
      .selectAll(),
  )
}

function testHugeDBInsert(db: Kysely<DB>) {
  db.insertInto('my_table').defaultValues()

  expectError(db.insertInto('not_a_table').defaultValues())
}

function testHugeDBUpdate(db: Kysely<DB>) {
  db.updateTable('my_table').where((eb) => eb('my_table.id', 'in', [1, 2, 3]))
  db.updateTable('my_table')
    .from('table_000a8a0cb7f265a624c851d3e7f8b946')
    .where((eb) => eb('my_table.id', 'in', [1, 2, 3]))
    .set('my_table.col_164b7896ec8e770207febe0812c5f052', 1)

  expectError(
    db.updateTable('not_a_table').where('my_table.id', 'in', [1, 2, 3]),
  )
}

function testHugeDBDelete(db: Kysely<DB>) {
  db.deleteFrom('my_table').where((eb) => eb('my_table.id', 'in', [1, 2, 3]))

  expectError(
    db.deleteFrom('not_a_table').where('my_table.id', 'in', [1, 2, 3]),
  )
}
