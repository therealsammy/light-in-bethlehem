# Light in Bethlehem: rehearsal site

A website for the cast of *Light in Bethlehem: A Christmas Musical*. Cast members open it on their phones to read the script, see their own lines, practise them, and play the songs where they come in.

## What the cast can do

- **Pick your role:** their lines are highlighted, and they see a list of the scenes and songs they're in.
- **Practice mode:** hides their lines so they can test themselves. Tapping a line reveals it.
- **Rehearse from here:** the phone reads everyone else's lines aloud, stops for theirs, and pauses at each song.
- **"I know this" checkboxes:** track which scenes they've learned. This is saved on their own phone only.
- **Share this role's link:** gives a link that opens straight on that role, e.g. `.../light-in-bethlehem/?role=Mary`.

## Editing (no coding needed)

Everything comes from two files. Edit them on github.com (open the file, click the pencil icon, then **Commit changes**), and the site updates a minute or two after the change reaches `main`.

### `script.md`: the play

| To add | Write it like this |
| --- | --- |
| A line | `**JOSEPH:** Madam, it is the year zero.` |
| Stage direction | `*Joseph and Mary move on.*` |
| Director's note | `> Joseph: really wait for the audience here.` |
| A scene | `### Scene 4: The Market` |
| A song | `### Song 12: Song Name` (the number must match an entry in `songs.json`) |
| An act | `## Act 5: Title` |

A new character speaking for the first time is added to the role list automatically. The director's notes marked with `>` are drafts, so edit or delete them as you like.

### `songs.json`: the song links

Each song can have a `"soundcloud"` link (audio only, preferred) and/or a `"youtube"` link. If both are filled in, SoundCloud plays. `"start"` and `"end"` are optional, so the cast only hear the part they sing:

```json
"3": {"artist": "Boney M", "search": "Mary's Boy Child Boney M", "soundcloud": "https://soundcloud.com/boney-m-official/marys-boy-child-oh-my-lord-1", "youtube": "", "start": "0:15", "end": "2:40"},
```

Keep the quotes and the comma at the end of each line. A song with no link gets a **Find on YouTube** button instead. The **Cast & songs** page shows which songs still need links.

Songs that still need a link: Joy to the World (highlife), We Three Kings and Excess Love. None had a good official upload on SoundCloud, so use YouTube links for those. Chinedum uses a YouTube link.

If the cast report that a song won't play, or only plays a 30-second preview, swap in another upload of the same song.

## Privacy

The site is public to anyone with the link. Use character names only, and don't add the teenagers' full names, phone numbers or photos.
