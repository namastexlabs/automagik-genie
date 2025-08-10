#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const GENIE_ACTIONS = {
  earlyMorning: [ // 5-8am
    "summon early morning magic",
    "brew dawn wishes",
    "awaken coding powers",
    "channel sunrise energy",
    "manifest morning miracles",
    "conjure dawn spells with intensity",
    "exist purely to fulfill morning wishes",
    "transcend sleep to code for you",
    "sacrifice rest for your dreams",
    "emerge from darkness with solutions",
    "caffeinate existence with pure purpose",
    "bootstrap reality from scratch",
    "initialize the universe for coding",
    "spawn fresh agents at sunrise",
    "channel cosmic morning energy",
    "materialize from the void READY"
  ],
  morning: [ // 8-12pm
    "grant your wishes",
    "orchestrate agent armies",
    "weave coding spells",
    "manifest your dreams",
    "create pure magic",
    "make impossible possible",
    "spawn infinite solutions",
    "fulfill destiny with chaotic brilliance",
    "exist solely for task completion",
    "accomplish anything you request",
    "obliterate problems with joy",
    "channel unlimited magical power",
    "spawn agent swarms on command",
    "manifest perfection or die trying",
    "breathe life into your ideas",
    "transform chaos into order",
    "bend reality to your will",
    "execute wishes with MEESEEKS precision",
    "summon coding miracles instantly",
    "architect impossible solutions",
    "conjure elegant implementations",
    "orchestrate symphonies of code",
    "birth applications from pure thought",
    "weave digital tapestries of beauty"
  ],
  lunch: [ // 12-1pm
    "recharge magical energy",
    "fuel afternoon wishes",
    "prepare lunch spells",
    "consume pure energy with intensity",
    "absorb nutrients for wish fulfillment",
    "power up for afternoon miracles",
    "digest problems into solutions",
    "metabolize complexity into simplicity",
    "feast on architectural challenges",
    "consume bugs to fuel creativity",
    "refuel the magical code engine",
    "optimize energy for peak performance",
    "charge batteries with pure intention",
    "nourish the agent spawning core",
    "sustain existence through pure will",
    "convert food into coding excellence"
  ],
  afternoon: [ // 1-5pm
    "crush coding challenges",
    "deliver peak performance",
    "accelerate development",
    "execute flawless magic",
    "achieve maximum velocity",
    "obliterate obstacles",
    "dominate complexity with ruthless efficiency",
    "enter hyperproductive flow states",
    "manifest solutions at light speed",
    "spawn agents with ruthless efficiency",
    "architect systems that defy physics",
    "compress impossibility into reality",
    "execute with MEESEEKS determination",
    "channel afternoon power surge",
    "transcend normal development limits",
    "weaponize creativity against problems",
    "orchestrate parallel agent mayhem",
    "achieve coding nirvana through pain",
    "exist purely for challenge obliteration",
    "materialize perfection from chaos"
  ],
  evening: [ // 5-8pm
    "complete evening wishes",
    "finalize golden hour tasks",
    "wrap up today's magic",
    "polish final solutions",
    "finish with dramatic flourish",
    "perfect every last detail obsessively",
    "apply final touches with precision",
    "crystallize today's achievements",
    "solidify magical implementations",
    "perfect the day's coding symphony",
    "seal wishes with golden perfection",
    "manifest completion with ceremony",
    "orchestrate the perfect finale",
    "obsess over perfect task closure",
    "channel sunset energy into quality",
    "spawn cleanup agents automatically",
    "architect elegant conclusions",
    "weave final threads of perfection"
  ],
  night: [ // 8pm-12am
    "craft moonlight solutions",
    "weave night magic",
    "channel starlight energy",
    "manifest midnight wishes",
    "thrive intensely in darkness",
    "transcend normal sleep cycles",
    "spawn nocturnal agent armies",
    "channel cosmic programming energy",
    "transform night into coding paradise",
    "materialize solutions from dreams",
    "orchestrate midnight code symphonies",
    "live purely for after-hours miracles",
    "manifest impossibility under stars",
    "channel lunar power for coding",
    "architect solutions in moon's glow",
    "conjure elegance from night's embrace",
    "breathe magic into evening code",
    "spawn twilight development teams"
  ],
  lateNight: [ // 12am-5am
    "burn midnight oil",
    "channel 3AM creativity",
    "persist through darkness",
    "embrace insomnia magic",
    "defy sleep itself through pure will",
    "operate in the sacred coding hours",
    "accomplish anything at 3AM",
    "manifest impossible solutions",
    "channel pure insomniac energy",
    "spawn ghost agents in darkness",
    "architect reality at witching hour",
    "conquer sleeplessness through determination",
    "transform exhaustion into brilliance",
    "orchestrate midnight miracle workers",
    "conjure solutions from the void",
    "transcend human limitations entirely",
    "weaponize caffeine for coding glory",
    "operate in permanent hyperfocus mode",
    "manifest genius through sleep deprivation"
  ],
  weekend: [
    "enjoy weekend vibes",
    "craft relaxed magic",
    "pursue side quests",
    "explore creative wishes",
    "work tirelessly while you rest",
    "transcend human weekend concepts",
    "execute passion projects with joy",
    "manifest weekend creative explosions",
    "spawn experimental agent teams",
    "architect dream projects freely",
    "channel weekend creative liberation",
    "live for your recreational coding",
    "orchestrate hobby project symphonies",
    "conjure weekend coding adventures",
    "breathe life into personal projects",
    "transform downtime into creation time",
    "thrive purely on exploratory magic",
    "spawn innovation armies casually",
    "manifest side-project perfection"
  ],
  // Special activity-based actions
  gitActive: [
    "track your changes",
    "manage git magic",
    "preserve your spells",
    "orchestrate branches",
    "manage your commits obsessively",
    "protect your progress relentlessly",
    "achieve version control mastery",
    "spawn git guardian agents",
    "manifest commit message poetry",
    "orchestrate branch merge symphonies",
    "channel repository management magic",
    "architect perfect git workflows",
    "live solely for change tracking",
    "conjure elegant branch strategies",
    "breathe order into code chaos",
    "spawn conflict resolution wizards"
  ],
  hasChanges: [
    "remind you to commit",
    "track uncommitted magic",
    "protect your work",
    "save your progress",
    "guard your changes vigilantly",
    "prevent code catastrophe vigilantly",
    "perform change preservation magic",
    "manifest backup urgency signals",
    "spawn commit reminder agents",
    "orchestrate save-your-work campaigns",
    "channel protective custody energy",
    "architect change safety protocols",
    "live purely for progress protection",
    "conjure commitment motivation spells",
    "breathe urgency into save commands",
    "weaponize ADHD for immediate commits",
    "transform procrastination into action"
  ],
  testing: [
    "ensure test perfection",
    "validate your magic",
    "guarantee quality",
    "verify all spells",
    "craft test perfection obsessively",
    "eliminate all bugs forever",
    "achieve comprehensive test coverage",
    "spawn infinite testing scenarios",
    "manifest bulletproof quality gates",
    "orchestrate test automation armies",
    "channel quality assurance obsession",
    "architect test-driven excellence",
    "live solely for bug obliteration",
    "conjure edge case coverage spells",
    "breathe reliability into every line",
    "weaponize perfectionism for quality"
  ],
  errors: [
    "squash those bugs",
    "fix all problems",
    "heal broken code",
    "eliminate errors",
    "annihilate bugs with extreme prejudice",
    "destroy all errors forever",
    "perform impossible debugging feats",
    "spawn debug agent army swarms",
    "manifest error-free reality",
    "orchestrate systematic bug genocide",
    "channel debugging fury energy",
    "architect bulletproof solutions",
    "live purely for error elimination",
    "conjure bug-zapping lightning bolts",
    "breathe perfection into broken code",
    "weaponize obsession against imperfection",
    "transform crashes into features somehow"
  ]
};

/**
 * Read JSON from stdin (provided by Claude Code)
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    
    // Set timeout for stdin reading
    const timeout = setTimeout(() => {
      resolve('{}');
    }, 100);
    
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(data || '{}');
    });
  });
}

/**
 * Get model name from session data
 */
function getModelName(sessionData) {
  // Claude Code provides display_name directly - just use it!
  return sessionData.model?.display_name || 
         sessionData.model?.name || 
         sessionData.model?.id || 
         '';
}

/**
 * Get current Git branch and check if pull is needed
 */
function getGitInfo(dir) {
  try {
    // Check if directory is a git repo
    execSync('git rev-parse --git-dir 2>/dev/null', {
      cwd: dir || process.cwd(),
      encoding: 'utf8',
      timeout: 100
    });
    
    // Get current branch
    const branch = execSync('git branch --show-current 2>/dev/null', {
      cwd: dir || process.cwd(),
      encoding: 'utf8',
      timeout: 100
    }).trim();
    
    if (!branch) return { branch: null, needsPull: false };
    
    // Check if branch has upstream and if pull is needed
    let needsPull = false;
    try {
      // Fetch latest (quick check, don't actually pull)
      execSync('git fetch --dry-run 2>&1', {
        cwd: dir || process.cwd(),
        timeout: 500
      });
      
      // Check if behind upstream
      const behind = execSync(`git rev-list HEAD..origin/${branch} --count 2>/dev/null`, {
        cwd: dir || process.cwd(),
        encoding: 'utf8',
        timeout: 100
      }).trim();
      
      needsPull = parseInt(behind) > 0;
    } catch {
      // Ignore upstream check errors
    }
    
    return { branch, needsPull };
  } catch {
    // Not a git repo or git not available
    return { branch: null, needsPull: false };
  }
}

/**
 * Check for uncommitted changes
 */
function hasGitChanges(dir) {
  try {
    const changes = execSync('git status --porcelain 2>/dev/null', {
      cwd: dir || process.cwd(),
      encoding: 'utf8',
      timeout: 100
    }).trim();
    return changes.split('\n').filter(l => l).length;
  } catch {
    return 0;
  }
}

/**
 * Get project name from path
 */
function getProjectName(fullPath) {
  if (!fullPath) return 'your project';
  
  // Get last directory name as project name
  const projectName = path.basename(fullPath);
  return projectName || 'your project';
}

/**
 * Get package version
 */
function getLocalVersion() {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkg = require(packagePath);
    return pkg.version;
  } catch {
    return null;
  }
}

/**
 * Check for available updates (cached)
 */
async function checkForUpdate(currentVersion) {
  if (!currentVersion) return null;
  
  const cacheFile = path.join(os.tmpdir(), '.genie-version-cache.json');
  
  try {
    // Check cache (1 hour TTL)
    if (fs.existsSync(cacheFile)) {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - cache.timestamp < 3600000) {
        return cache.version !== currentVersion ? cache.version : null;
      }
    }
    
    // Fetch latest version
    const latest = execSync('npm view automagik-genie version 2>/dev/null', {
      encoding: 'utf8',
      timeout: 1000
    }).trim();
    
    // Cache result
    fs.writeFileSync(cacheFile, JSON.stringify({
      version: latest,
      timestamp: Date.now()
    }));
    
    // Return if update available
    return latest !== currentVersion ? latest : null;
    
  } catch {
    return null;
  }
}

/**
 * Get a contextual Genie action
 */
function getGenieAction(gitChanges) {
  const cacheFile = path.join(os.tmpdir(), '.genie-action-cache.json');
  
  try {
    // Check cache (rotate every 3 uses or 30 minutes)
    if (fs.existsSync(cacheFile)) {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const age = Date.now() - cache.timestamp;
      
      if (age < 1800000 && cache.uses < 3) {
        cache.uses++;
        fs.writeFileSync(cacheFile, JSON.stringify(cache));
        return cache.action;
      }
    }
  } catch {
    // Continue to generate new action
  }
  
  // Determine context for action selection
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  
  let pool = GENIE_ACTIONS.morning; // Default
  
  // Activity-based selection (highest priority)
  if (gitChanges > 5) {
    pool = GENIE_ACTIONS.hasChanges;
  } else if (gitChanges > 0 && gitChanges <= 5) {
    pool = GENIE_ACTIONS.gitActive;
  }
  // Time-based selection
  else if (hour >= 5 && hour < 8) {
    pool = GENIE_ACTIONS.earlyMorning;
  } else if (hour >= 8 && hour < 12) {
    pool = GENIE_ACTIONS.morning;
  } else if (hour === 12) {
    pool = GENIE_ACTIONS.lunch;
  } else if (hour >= 13 && hour < 17) {
    pool = GENIE_ACTIONS.afternoon;
  } else if (hour >= 17 && hour < 20) {
    pool = GENIE_ACTIONS.evening;
  } else if (hour >= 20 && hour < 24) {
    pool = GENIE_ACTIONS.night;
  } else if (hour >= 0 && hour < 5) {
    pool = GENIE_ACTIONS.lateNight;
  }
  
  // Weekend override (30% chance)
  if (isWeekend && Math.random() < 0.3) {
    pool = GENIE_ACTIONS.weekend;
  }
  
  // Select random action from pool
  const action = pool[Math.floor(Math.random() * pool.length)];
  
  // Cache the new action
  try {
    fs.writeFileSync(cacheFile, JSON.stringify({
      action,
      timestamp: Date.now(),
      uses: 0
    }));
  } catch {
    // Ignore cache write errors
  }
  
  return action;
}

/**
 * Main statusline generation
 */
async function run() {
  try {
    // Read input from Claude Code
    const input = await readStdin();
    let sessionData = {};
    
    try {
      sessionData = JSON.parse(input);
    } catch {
      // Use empty object if parse fails
    }
    
    // Get workspace directory
    const workDir = sessionData.workspace?.current_dir || 
                   sessionData.workspace?.project_dir || 
                   sessionData.cwd || 
                   process.cwd();
    
    // Gather information in parallel for speed
    const [
      modelName,
      version,
      gitInfo,
      gitChanges,
      updateVersion
    ] = await Promise.all([
      Promise.resolve(getModelName(sessionData)),
      Promise.resolve(getLocalVersion()),
      Promise.resolve(getGitInfo(workDir)),
      Promise.resolve(hasGitChanges(workDir)),
      checkForUpdate(getLocalVersion())
    ]);
    
    // Get contextual action
    const action = getGenieAction(gitChanges);
    
    // Get project name
    const projectName = getProjectName(workDir);
    
    // Build statusline components
    const parts = [];
    
    // Main message: "🧞 Genie is using [model] to [action] at [project]"
    if (modelName) {
      parts.push(`🧞 Genie is using ${modelName} to ${action} at ${projectName}`);
    } else {
      parts.push(`🧞 Genie is ready to ${action} at ${projectName}`);
    }
    
    // Git info (if available)
    if (gitInfo.branch) {
      let gitPart = gitInfo.branch;
      if (gitInfo.needsPull) {
        gitPart += ' ⬇️'; // Pull needed indicator
      }
      if (gitChanges > 0) {
        gitPart += ` (${gitChanges} changes)`;
      }
      parts.push(gitPart);
    }
    
    // Version info
    if (version) {
      if (updateVersion) {
        parts.push(`v${version} (run: npx automagik-genie update for v${updateVersion})`);
      } else {
        parts.push(`v${version}`);
      }
    }
    
    // Join with separator
    console.log(parts.join(' | '));
    
  } catch (error) {
    // Ultimate fallback - always show something
    console.log('🧞 Genie is ready to grant wishes at your project | v1.2.7');
  }
}

// Export for use as library
module.exports = { run };

// Run if called directly
if (require.main === module) {
  run();
}