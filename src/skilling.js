// The gathering loop: stand next to a tree, rock, fishing spot or herb, press E, and your wizard
// keeps swinging until the node runs out or you walk away (RuneScape style).
import { SKILLS, skillLevel, gatherChance, gatherTime, needsTool, rollGem, addSkillXp } from './skills.js';
import { ITEMS, addItem, bestTool } from './items.js';
import { sfx } from './audio.js';

const TOOL_NAMES = { mining: 'pickaxe', woodcutting: 'axe', fishing: 'fishing rod' };
const VERB_ING = { mining: 'Mining', woodcutting: 'Chopping', fishing: 'Fishing', foraging: 'Picking' };
const SOUND = { mining: 'mine', woodcutting: 'chop', fishing: 'splash', foraging: 'pick' };
const CHIPS = { mining: 0xb0a8c0, woodcutting: 0xd8b070, fishing: 0xbfe8ff, foraging: 0x7adc6a };

export class Gatherer {
  constructor({ world, getPlayer, onGain, onMessage }) {
    this.world = world;
    this.getPlayer = getPlayer;
    this.onGain = onGain;
    this.onMessage = onMessage;
    this.active = null;
  }

  get busy() { return !!this.active; }

  start(node) {
    const p = this.getPlayer(), def = node.def;
    if (node.depleted) return this.onMessage?.('There is nothing left here. It will grow back soon.');
    if (skillLevel(p, def.skill) < def.level) {
      sfx('fail');
      return this.onMessage?.(`You need ${SKILLS[def.skill].name} level ${def.level} for the ${def.name}.`);
    }
    if (needsTool(def) && !bestTool(p, def.skill)) {
      sfx('fail');
      return this.onMessage?.(`You need a ${TOOL_NAMES[def.skill]}. Forewoman Brisa in Millbrook Meadow sells them.`);
    }
    this.active = { node, t: 0, swing: gatherTime(p, def), fx: 0.3 };
    this.world.moveTarget = null;
    const pp = this.world.player.position;
    this.world.heading = Math.atan2(node.x - pp.x, node.z - pp.z);
  }

  stop() { this.active = null; }

  update(dt) {
    const a = this.active;
    if (!a) return;
    const w = this.world, p = this.getPlayer(), node = a.node, def = node.def;
    const pp = w.player.position;
    if (w.isMoving || w.dashT > 0 || node.depleted || Math.hypot(node.x - pp.x, node.z - pp.z) > node.r + 1.2) { this.stop(); return; }
    a.t += dt;
    a.fx += dt;
    if (a.fx > 0.6) {
      a.fx = 0;
      w.castPose(w.player);
      sfx(SOUND[def.skill]);
      const y = def.skill === 'woodcutting' ? 1.2 : def.skill === 'fishing' ? 0.2 : 0.6;
      w.puff(node.x + (pp.x - node.x) * 0.3, y, node.z + (pp.z - node.z) * 0.3, CHIPS[def.skill], 6, def.skill === 'fishing' ? 2.5 : 3);
      if (def.skill !== 'fishing') w.hitReact(node.full);
    }
    if (a.t < a.swing) return;
    a.t = 0;
    a.swing = gatherTime(p, def);
    if (Math.random() > gatherChance(p, def)) return;
    addItem(p, def.item);
    const levels = addSkillXp(p, def.skill, def.xp);
    const gem = def.skill === 'mining' ? rollGem() : null;
    if (gem) addItem(p, gem);
    p.stats_log.gathered++;
    w.float(w.player, `+1 ${ITEMS[def.item].name}`, 'gain');
    if (Math.random() < def.deplete) {
      w.depleteNode(node);
      this.stop();
    }
    this.onGain?.(def, levels, gem);
  }

  // For the action bar: what you are doing and how far along the swing is.
  progress() {
    const a = this.active;
    if (!a) return null;
    return { label: `${VERB_ING[a.node.def.skill]} · ${a.node.def.name}`, k: Math.min(1, a.t / a.swing), icon: SKILLS[a.node.def.skill].icon };
  }
}
