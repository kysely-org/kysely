/* @name exportAssets */
select asset.id, asset.name, folder.name as folder_name
from asset
left join folder on folder.id = asset.folder_id
where asset.owner_id = :ownerId!
  and (:albumId::text is null or exists (
    select 1 from album_asset
    where album_asset.asset_id = asset.id
      and album_asset.album_id = :albumId
  ))
  and (:namePrefix::text is null or asset.name like :namePrefix || '%')
order by asset.name, asset.id;
