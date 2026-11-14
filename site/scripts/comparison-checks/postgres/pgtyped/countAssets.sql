/* @name countAssets */
select count(*)::integer as count
from asset
where asset.owner_id = :ownerId!
  and (:albumId::text is null or exists (
    select 1 from album_asset
    where album_asset.asset_id = asset.id
      and album_asset.album_id = :albumId
  ))
  and (:namePrefix::text is null or asset.name like :namePrefix || '%');
