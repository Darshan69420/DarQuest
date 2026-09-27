# Sol Quest 0.4 — The First Light

## Implemented and checked

1. Three character slots; one-time legacy migration keeps a backup. Overwrite names the existing character and level. Deletion returns to the list. Unit checks cover migration/storage failure; browser checks cover two independent characters and deletion.
2. Camera smoothing stays on the rear ray. Desktop approach to Orvyn was visually checked; more narrow-space playtesting remains.
3. Dialogue completes on the first Escape/Space/click while typing. Subsequent Escape closes. Browser checks verify the two-step Escape sequence.
4. Ground routes use bounded obstacle navigation. Tests cover fountain avoidance, blocked destinations and front-facing interaction preference. Full click-path browser acceptance remains open.
5. Enemies leash at 25 units and heal when returning; pulls recruit only two nearby eligible friends. Foes four levels below remain passive until attacked. Unit tested.
6. Reduced overworld Wisp/Knight/Crow pressure and potion quest rewards. A bounded combat model ran 432 school/seed/encounter combinations without deaths. **The requested 30–40% health-cost target is not yet met consistently.** Solo gross damage averages were 4.4%, 25.3%, and 7.3%; grouped averages 11%, 54%, and 27%. These scripted fights are not a full human playthrough.
7. Distant animation/AI work is skipped beyond 60 units; enemy geometry is shared. Low/medium/high and optional automatic reduction retain the chosen preset. **55 FPS on integrated graphics has not been measured.**
8. Defeat shows zero health; respawn clears movement, scale and stale visual effects. A complete defeat browser scenario remains open.
9. A saved first-combat hint explains attack, targeting and dodge with the configured keys.
10. Basic attacks show “Free”; spell cards use the combat cost/cooldown helpers.

Settings include three volume controls, graphics, automatic reduction, text size, contrast warnings and key rebinding. Browser checks exercised settings and rebound movement. Rift/Archive rewards scale with cleared depth and preserve a run summary. Completion has a reward screen. Hollowmere/Pyrrhon have repeating marked attacks and recovery windows. Enemy blades cap at three and are consumed by a dodged attack. Cast pulses restore a stored base scale.

## Verification

- 35 Node tests pass; 900 Rift stages and 900 Archive rooms pass content checks.
- Desktop browser smoke checks pass without page errors: character creation, independent slots, deletion, dialogue dismissal, settings and rebound movement.
- Gameplay screenshots inspected at 1280×720 and touch 390×844; title screen inspected at desktop size.
- Test scripts and screenshots are local under ignored `work/`.

## Remaining release gates

- Human Chapter 1 playthrough and combat tuning to the requested damage band.
- Physical phone control comfort; integrated-GPU frame-time measurement.
- Browser acceptance for full fountain routes, overlapping effects and defeat/respawn; full boss encounters and completed run reward screens.
- Some legacy emoji artwork and help text remain; the title, major controls and spell sigils received the first visual pass.
- The name is Sol Quest, but repository/storage compatibility identifiers remain DarQuest. No crypto economy or wallet integration was added.
