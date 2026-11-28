/* @name findAssetsWithTags */
select asset.id, asset.name,
  coalesce((
    select json_agg(tag_rows)
    from (
      select tag.id, tag.name
      from asset_tag
      inner join tag on tag.id = asset_tag.tag_id
      where asset_tag.asset_id = asset.id
      order by tag.name
    ) as tag_rows
  ), '[]'::json) as tags
from asset
where asset.owner_id = :ownerId!
  and (:albumId::text is null or exists (
    select 1 from album_asset
    where album_asset.asset_id = asset.id
      and album_asset.album_id = :albumId
  ))
  and (:namePrefix::text is null or asset.name like :namePrefix || '%')
order by asset.name, asset.id
limit 50;
