# Light in Bethlehem: rehearsal site

A website for the cast of *Light in Bethlehem: A Christmas Musical*. Cast members open it on their phones to read the script, see their own lines, practise them, and play the songs where they come in.

**Live site:** https://therealsammy.github.io/light-in-bethlehem/

Every change merged into `main` is published there automatically by the GitHub Pages workflow in `.github/workflows/pages.yml`. (The `Clss 6 Pre-Assignment` folder is an older, unrelated class project.)

## What the cast can do

The site has four tabs:

- **Script:** the whole play, with each character in their own colour. After picking a role, your lines turn gold. "Hide my lines" blurs them so you can test yourself, and A− / A+ changes the text size. Each scene has a **Rehearse** button: the phone reads everyone else's lines aloud, stops for yours, and pauses at songs.
- **My part:** your character notes, how many lines, scenes and songs you have, your progress, and the director's notes meant for you. **Cue cards** show the line before each of yours. Say your line, tap to check it, then mark it "Got it" or "Again later". Tick scenes off as you learn them (saved on your phone only). **Share my link** opens the site straight on your role, e.g. `https://therealsammy.github.io/light-in-bethlehem/?role=Mary`.
- **Songs:** all the songs in show order, each with its player and where it comes in the show.
- **Cast:** every character, staging and props, and the general director's notes.

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

Each song can have an `"audiomack"` link or a `"soundcloud"` link (both audio only), and/or a `"youtube"` link (shows a small video while it plays). If more than one is filled in, Audiomack plays first, then SoundCloud, then YouTube. For Audiomack, paste the song's normal page link (like `https://audiomack.com/mercychinwo/song/omekannaya`), or the link inside Audiomack's **Embed** code if that one doesn't load.

`"start"` and `"end"` are optional (SoundCloud and YouTube only), so the cast only hear the part they sing:

```json
"3": {"artist": "Boney M", "search": "Mary's Boy Child Boney M", "audiomack": "", "soundcloud": "https://soundcloud.com/boney-m-official/marys-boy-child-oh-my-lord-1", "youtube": "", "start": "0:15", "end": "2:40"},
```

Keep the quotes and the comma at the end of each line. The **Songs** tab shows which songs still need a recording. Right now every song has one.

If the cast report that a song won't play, or only plays a 30-second preview, swap in another upload of the same song.

## Privacy

The site is public to anyone with the link. Use character names only, and don't add the teenagers' full names, phone numbers or photos.
