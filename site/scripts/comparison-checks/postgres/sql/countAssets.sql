-- @param {String} $1:ownerId
-- @param {String} $2:albumId?
-- @param {String} $3:namePrefix?
select count(*)::integer as count
from asset
where asset.owner_id = $1
  and ($2::text is null or exists (
    select 1 from album_asset
    where album_asset.asset_id = asset.id
      and album_asset.album_id = $2
  ))
  and ($3::text is null or asset.name like $3 || '%');
