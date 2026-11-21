create table folder (id text primary key, name text not null);
create table asset (id text primary key, name text not null, owner_id text not null, folder_id text references folder(id));
create table album_asset (album_id text not null, asset_id text not null references asset(id), primary key (album_id, asset_id));
create table tag (id text primary key, name text not null);
create table asset_tag (asset_id text references asset(id), tag_id text references tag(id), primary key (asset_id, tag_id));
