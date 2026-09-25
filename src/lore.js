// Conversations: questions you can ask people about the world ("Ask about..."), and a few
// choices that change what you are rewarded with and how the story ends.
import { storyIndex } from './state.js';

// need: how far the story must have got (quest index) before the topic appears.
export const TOPICS = {
  orvyn: [
    { id: 'academy', q: 'Tell me about Starfall Academy.', a: 'Starfall has trained wizards for eight hundred years. Six schools, one courtyard, and far too many stairs. We teach every student the same first lesson: magic is a promise to protect, not a license to rule.' },
    { id: 'doors', q: 'What are the Spiral Doors?', a: 'Ancient portals, older than the Academy. Each one leads to a different land. They wake when a land needs help, which is why so many have woken at once. That worried me long before I knew why.' },
    { id: 'malvoren', need: 37, q: 'Who was Malvoren?', a: 'My student. The brightest I ever taught, and the hungriest. He believed magic should belong to whoever was strong enough to take it. When I refused to teach him the forbidden arts, he left in the night and took three of my books with him.' },
    { id: 'why', need: 44, q: 'Why did he do all this?', a: 'He wanted to rewrite how magic works, so that only he could use it. Every monster you fought was a test of a new spell. Hollowmere, Pyrrhon, the dragons, the Queen... all experiments. I should have stopped him years ago.' },
  ],
  mirabel: [
    { id: 'schools', q: 'How do the schools of magic work?', a: 'Six schools, and each one is strong against some foes and weak against others. Fire melts ice, frost cools lava, earth grounds a storm. Check the Bestiary (J) to see what each foe fears. And never forget Astral spells: every student can learn those.' },
    { id: 'second', need: 7, q: 'Can I learn another school?', a: 'From level 10, yes! Choose a second school here with me. Its spells cost more to learn and come a little later, but mixing schools is how great wizards are made.' },
  ],
  vaelith: [
    { id: 'voice', need: 14, q: 'What is the Voice?', a: 'The language of dragons. Every word is a spell, and a Word Wall holds a word carved in dragon runes. Most people cannot even read them. You can. That is rare, and a little frightening.' },
    { id: 'souls', need: 14, q: 'Why do dragons leave souls behind?', a: 'A dragon\'s soul is too big to simply fade. It looks for someone who speaks its tongue. When you absorb one, you understand a little more of the Voice. Spend them on deeper shout words.' },
  ],
  nyx: [
    { id: 'rift', q: 'What is the Endless Rift?', a: 'A crack in the world that never heals. Every time you enter, it rearranges itself. Some say it goes down forever. I have been to floor forty. There was a floor forty-one.' },
  ],
  ingrid: [
    { id: 'aurora', need: 24, q: 'What does the aurora say?', a: 'It remembers everything that happens beneath it. Lately it keeps showing me the same pale hand, and strings running from it to every land. Hollowmere. Pyrrhon. The dragons. Our Queen. The same puppeteer, every time.' },
  ],
  tavi: [
    { id: 'rods', need: 31, q: 'How do the islands float?', a: 'The lightning rods catch the storm\'s power and feed it to the crystals under each island. No storm, no floating. That is why Voltaris is so clever, and so dangerous: he controls the one thing keeping us in the sky.' },
  ],
  rowan: [
    { id: 'mother', need: 38, q: 'Tell me about the Elder Mother.', a: 'She was a seed when the first Spiral Door opened. Her roots reach every land, some say, even down into the Hollow Deep. If she dies, the forests of the world will feel it.' },
  ],
  lyra: [
    { id: 'apprentice', need: 45, q: 'Why did you leave Malvoren?', a: 'He asked me to turn my own sister into an echo, to "study" her. I said no. That night I ran, and I did not stop running until I reached this cave.' },
    { id: 'weakness', need: 45, q: 'Does Malvoren have a weakness?', a: 'His pride. He cannot resist showing off. He will hide behind his ward, then take to the air, then try something enormous at the end. Break the anchors, dodge the void, and when the ring of death appears, get close to him.' },
  ],
  aldric: [
    { id: 'knight', need: 45, q: 'You were a Hollow Knight?', a: 'For thirty years. I remember all of it: every village we frightened, every traveller we chased. When Hollowmere fell, my will came back to me. I have been trying to earn it ever since.' },
  ],
};

// Choices that change your rewards and the ending. need: the quest index when it becomes available.
export const CHOICES = {
  sylvara: {
    npc: 'halvard', need: 30, title: 'The Queen\'s fate',
    text: 'The Queen is waking. She remembers everything the Magister made her do, and she weeps for it. The town is split, and they want you to decide. What should become of Queen Sylvara?',
    options: [
      { id: 'mercy', label: '❄️ Let her rule again. The spell was not her fault.', reward: { gear: 'winterheart', rarity: 'epic' }, reply: 'Mercy. The aurora will remember that. Take this, from the Queen herself.' },
      { id: 'justice', label: '⚖️ She must answer for the winter.', reward: { gold: 2000 }, reply: 'Justice, then. She will live in quiet exile, and Frostholm will choose a council. The town sends its thanks, and its gold.' },
    ],
    epilogue: { mercy: 'Queen Sylvara rules Frostholm again, kinder than she ever was.', justice: 'Frostholm is ruled by a council now, and Sylvara lives quietly in the far north.' },
  },
  raiders: {
    npc: 'aeris', need: 35, title: 'The Skyraiders',
    text: 'We caught the Skyraider captain and her crew. Skyport wants them locked away forever. But they know these skies better than anyone... What do we do with them?',
    options: [
      { id: 'pardon', label: '⚡ Give them a second chance, as Skyport\'s guard.', reward: { gear: 'storm_sigil', rarity: 'epic' }, reply: 'Pirates guarding the harbour! It is mad enough to work. The captain wanted you to have her sigil.' },
      { id: 'jail', label: '🔒 Lock them up. Skyport deserves justice.', reward: { gold: 2500 }, reply: 'Into the cells they go. The merchants of Skyport are very, very grateful.' },
    ],
    epilogue: { pardon: 'The Skyraiders guard Skyport\'s harbour now, and no pirate dares come near.', jail: 'The Skyraiders sit in Skyport\'s cells, and the merchants\' ships sail safe.' },
  },
  heartwood: {
    npc: 'rowan', need: 44, title: 'The Heartwood',
    text: 'The blight is gone, but the Thornmother\'s heart still beats inside the Heartwood. It could heal, given a hundred years. Or we could burn it, and be sure it never turns again. It is your choice.',
    options: [
      { id: 'heal', label: '🌱 Let it heal. The forest deserves its protector.', reward: { gear: 'seed_of_life', rarity: 'epic' }, reply: 'The Elder Mother agrees. She grew you this seed from her own heartwood.' },
      { id: 'burn', label: '🔥 Burn it. We cannot risk the blight returning.', reward: { gold: 3000 }, reply: 'It is done. The ash will feed new trees. The druids thank you, grimly.' },
    ],
    epilogue: { heal: 'In Thornwood, a new Thornmother is slowly growing, green and kind.', burn: 'Thornwood\'s Heartwood is ash, and young trees grow from it.' },
  },
};

export function topicsFor(p, npcId) {
  return (TOPICS[npcId] || []).filter(t => storyIndex(p) >= (t.need || 0));
}

export function pendingChoice(p, npcId) {
  return Object.entries(CHOICES).map(([id, c]) => ({ id, ...c }))
    .find(c => c.npc === npcId && storyIndex(p) >= c.need && !p.choices?.[c.id]) || null;
}

export function epilogueLines(p) {
  return Object.entries(CHOICES).map(([id, c]) => c.epilogue[p.choices?.[id]]).filter(Boolean);
}
