# 04b — Product photos (finding, checking and uploading real images)

## What I needed
Real product photos for the 12 demo products, not AI-generated images. They had to be free to use, credited properly, and stored in Supabase Storage so the API returns them.

## Prompt 1 — first attempt (part of the backend prompt)
```
scripts/upload_images.py: download 12 free Unsplash/Pexels photos (one per
product) and upload them to Storage, saving image_url and image_credit.
Show me the photo list before uploading.
```
My earlier instruction for images was: *"Dont just get it, take it from the google, instead of generating the images."*

**Result:** Unsplash blocked automated search (403). Wikimedia Commons refused connections from my network.

## Prompt 2 — switch source
```
Unsplash and Wikimedia are blocked from here. Use Openverse (openly licensed
images, Flickr source) with licence filter CC0 / PDM / CC BY only.
For each product: search 2–3 keywords, save the top results locally with their
title, author, licence and page link, so I can look at them before choosing.
Credits must use the exact original title and author, and a working photo link.
```
**Result:** candidates downloaded with metadata. The first credit list had guessed Flickr page links and shortened titles. Fixed: links now use `https://www.flickr.com/photo.gne?id=<id>` and the original titles, as CC BY requires.

## Prompt 3 — I asked where the photos were, then checked them by eye
> "where are the photos"

The previews were copied to `backend/scripts/preview/`. Looking at them, 4 of 12 were wrong even though their titles matched:
| Product | Problem |
|---|---|
| Echo Buds Pro | the "earbuds" photo was a handwritten diagram |
| ErgoFlex Mesh Chair | a sofa armchair, not an office chair |
| Glow LED Desk Lamp | blurry abstract shot |
| Lumen Smart Ring | download blocked (Wikimedia URL) |

## Prompt 4 — replace the wrong ones
> "If the images are wrong, then fetch and download other images"

```
Search again only for the 4 wrong products with new keywords
(earbuds, desk lamp, ergonomic / black office / swivel chair,
silver ring / ring jewelry / wedding band). Up to 6 candidates each.
Reject photos that show real people's faces, stage/launch shots or illustrations.
Prefer a clean product shot on a plain background.
```
Two rounds were needed (Openverse kept timing out with 500/504 errors, so the script retries).

**Final picks**
| Product | Photo |
|---|---|
| Echo Buds Pro | "Earbuds" by Dylan_Payne, CC BY 2.0 |
| Glow LED Desk Lamp | "Metal desk lamp and books pile" by freestocks.org, CC0 1.0 |
| ErgoFlex Mesh Chair | "multimedia desk" by grantlairdjr, CC BY 2.0 (black swivel office chair) |
| Lumen Smart Ring | "Silver ring with box" by Mauro Cateb, CC BY 2.0 |

## Problems and fixes
- **Broken character in a credit:** the speaker title "…0601 Weiß" was saved as "WeiÃŸ" (double-encoded text). Fixed in `images.json`.
- **Upload dropped mid-way:** Supabase Storage reset the connection after the first file, then the internet dropped. Added a 3-try retry around each upload in `upload_images.py`; the next run uploaded all 12.

## Resulting files
- `backend/scripts/images.json`: the 12 photos, download links, page links and exact credits
- `backend/scripts/upload_images.py`: lists the photos, or with `--upload` downloads them, puts them in the `product-images` bucket and saves `image_url` + `image_credit`

## Verification
- `python scripts/upload_images.py --upload` → 12 of 12 uploaded, "Done."
- In the running storefront every product card shows its photo, and each product page shows the credit under the image (checked in the browser).

## My check
-
