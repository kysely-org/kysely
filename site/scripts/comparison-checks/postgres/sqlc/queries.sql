-- name: FindAssets :many
select asset.id, asset.name
from asset
where asset.owner_id = sqlc.arg(owner_id)
  and (sqlc.narg(album_id)::text is null or exists (
    select 1 from album_asset
    where album_asset.asset_id = asset.id
      and album_asset.album_id = sqlc.narg(album_id)
  ))
  and (sqlc.narg(name_prefix)::text is null or asset.name like sqlc.narg(name_prefix) || '%')
order by asset.name, asset.id
limit 50;

-- name: CountAssets :one
select count(*)::integer as count
from asset
where asset.owner_id = sqlc.arg(owner_id)
  and (sqlc.narg(album_id)::text is null or exists (
    select 1 from album_asset
    where album_asset.asset_id = asset.id
      and album_asset.album_id = sqlc.narg(album_id)
  ))
  and (sqlc.narg(name_prefix)::text is null or asset.name like sqlc.narg(name_prefix) || '%');

-- name: FindAssetsWithTags :many
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
where asset.owner_id = sqlc.arg(owner_id)
  and (sqlc.narg(album_id)::text is null or exists (
    select 1 from album_asset
    where album_asset.asset_id = asset.id
      and album_asset.album_id = sqlc.narg(album_id)
  ))
  and (sqlc.narg(name_prefix)::text is null or asset.name like sqlc.narg(name_prefix) || '%')
order by asset.name, asset.id
limit 50;
