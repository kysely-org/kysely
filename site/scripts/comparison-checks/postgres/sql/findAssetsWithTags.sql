-- @param {String} $1:ownerId
-- @param {String} $2:albumId?
-- @param {String} $3:namePrefix?
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
where asset.owner_id = $1
  and ($2::text is null or exists (
    select 1 from album_asset
    where album_asset.asset_id = asset.id
      and album_asset.album_id = $2
  ))
  and ($3::text is null or asset.name like $3 || '%')
order by asset.name, asset.id
limit 50;
