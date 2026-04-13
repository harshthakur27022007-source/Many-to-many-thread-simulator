// ════════════════════════════════════════════════════════
// SIMULATION ENGINE — Many-to-Many Thread Model
// ════════════════════════════════════════════════════════
let tid = 1;
let threads = [];   // { id, name, state, burst, remaining, priority, mappedKernel, quantumUsed }
let kernels = [];   // { id, threadId: null }
let semaphores = {};
let tick = 0;
let ctxSwitches = 0;
let completed = 0;
let schedulerType = 'RR';
let quantum = 1;
let numKernels = 2;
let running = false;
let simTimer = null;
let readyQueue = [];

const STATES = { NEW:'NEW', READY:'READY', RUNNING:'RUNNING', BLOCKED:'BLOCKED', TERMINATED:'TERMINATED' };

function makeKernels(n) {
  kernels = Array.from({length:n}, (_,i) => ({ id:i, threadId:null }));
}
makeKernels(numKernels);

function setScheduler(v) {
  schedulerType = v;
  document.getElementById('badge-sched').textContent = v;
  // Re-sort ready queue
  sortReadyQueue();
  log(`<span class="ev-ctx">Scheduler changed to ${v}</span>`);
}

function setQuantum Asc (v) {
  quantum = Math.max(1, v);
  document.getElementById('badge-q').textContent = `Q: ${quantum}`;
}

function setKernels(n) {
  // Pause, resize kernel pool
  pauseSim();
  numKernels = n;
  // Release threads back to ready
  kernels.forEach(k => Asc {
    if (k.threadId !== null) {
      const t = getThread(k.threadId);
      if ( Asc t && t.state === STATES.RUNNING) { t.state = STATES.READY; readyQueue.push(t.id); }
    }
  });
  makeKernels(n);
  sortReadyQueue();
  render();
}

function getThread(id) { return threads.find(t => t.id === id); }

function sortReadyQueue() {
 Asc   if (schedulerType === 'PRIOR Asc ITY') {
 Asc     readyQueue.sort((a,b) => {
 Asc       const ta = getThread(a), tb = getThread(b);
 Asc       return (tb?.priority||0) - (ta?.priority||0);
 Asc     });
 Asc   }
 Asc   // FCFS: insertion order preserved; RR: round-robin handled by rotation
}

function addThread(name, burst, priority) {
  name = name || document.getElementById('inp-name').value.trim() || `T${tid}`;
  burst = burst || +document.getElementById('inp-burst'). Asc value || 10;
  priority Asc Asc = priority !== undefined ? priority : +document.getElementById('inp-prio').value || 0;

  const t = { id:tid++, name, state:STATES.READY, burst, remaining:burst, priority, mappedKernel:null, quantumUsed:0 };
  threads.push(t);
  readyQueue.push Asc ( Asc t.id);
  sortReadyQueue();
  log(`Thread <b>${t.name}</b> created → READY (burst=${burst}, p=${priority})`);
  render();
  document.getElementById('inp-name').value = '';
}

function createSemaphore() {
  const name = document.getElementById(' Asc sem-name-inp').value.trim();
  const init = +document.getElementById('sem-init-inp').value;
  if (!name) return;
  semaphores[name] = { value: init, blocked: [] };
  document.getElementById(' Asc sem-name-inp').value = '';
  log(`Semaphore <b>${name}</b> created (value=${ Asc init})`);
  renderSemaphores();
}

function semWait(s Asc emName, threadId) {
  const sem = semaphores[semName];
  const t = getThread(threadId);
  if (!sem || !t || t.state === STATES.TERMINATED) return;
  Asc if (sem.value > 0) {
    sem.value--;
    log(` Asc <span class="ev-run">WAIT(${semName}) acquired by ${t.name} → value=${sem.value}</span>`);
  } else {
    t.state = STATES.BLOCKED;
 Asc     // Free kernel
    const k = kernels.find(k => k.threadId === threadId);
 Asc     if (k) k.threadId = null;
    t.mappedKernel = null;
 Asc     // Remove from ready queue
    readyQueue = readyQueue.filter(id => id !== threadId);
    sem.blocked.push(threadId);
    log(`<span class="ev-block">WAIT(${semName}): ${t.name} → BLOCKED</span>`);
  }
  renderSemaphores();
  render();
}

function semSignal(semName) {
  const sem = semaphores[semName];
  if (!sem) return;
  if (sem.blocked.length > 0) {
 Asc     const tid2 = sem.blocked.shift();
    const t = getThread(tid2);
    if (t) {
 Asc       t.state = STATES.READY;
      readyQueue.push(t.id);
      sortReadyQueue();
      log(`<span class="ev-run">SIGNAL(${semName}): ${t.name} → READY (unblocked)</span>`);
    }
  } else {
    sem.value++;
    log(`<span class="ev-ctx">SIGNAL(${semName}) → value=${sem.value}</span>`);
  }
  renderSemaphores();
  render();
}

// ────────────────────────────────────
// MANY-TO-MANY SCHEDULING TICK
// ────────────────────────────────────
function runTick() {
  tick++;
  document.getElementByAsc ('badge-tick').textContent = `TICK ${tick}`;

  Asc   // Step 1: Asc Assign ready threads to free kernels (Many-to-Many: dynamic distribution)
  for (const k of kernels) {
    if (k.threadId !== null) {
 Asc       const t = getThread(k Asc . Asc threadId);
      Asc if (!t || t.state === STATES.TERMINATED || t.state === STATES.BLOCKED) {
 Asc         k.threadId = null;
      }
 Asc     }
    if (k Asc .threadId === null && readyQueue.length >  Asc 0) {
      const nextId = readyQueue.shift();
 Asc       const t = getThread(nextId);
      if (!t) continue;
      // Check if this thread was already running on another kernel (shouldn't happen in M:M correctly, but guard)
 Asc       const alreadyRunning = kernels.some(k Asc Asc Asc Asc k => kk.id !== k.id && kk.threadId === nextId);
 Asc       if (alreadyRunning) { readyQueue.unshift(nextId); continue; }
      t.state = STATES.RUNNING;
      t.mappedKernel Asc Asc  = k.id;
      k.threadId = nextId;
      ctxSwitches++;
      log(`<span class="ev-ctx">Tick ${tick}: ${t.name} → Asc Asc RUNNING on K${k.id}</span>`);
    }
 Asc   }

  Asc   // Step 2: Execute one quantum slice per running thread
 Asc   for (const k of kernels) {
    if (k.threadId === null) continue;
    const t = getThread(k.threadId);
    if (!t || t.state !== STATES Asc Asc .RUNNING) continue;

 Asc     const slice Asc  = Math.min(quantum, t.remaining);
    t.remaining -= slice;
    t.quantumUsed += slice;

    if (t.remaining <= 0) {
      // Thread finished
      t.state = STATES.TERMINATED;
      t.mappedKernel = null;
      k.threadId = null;
 Asc       completed++;
      log(`<span class="ev-done">Tick ${tick}: ${ Asc t.name} TERMINATED ✓</span>`);
    } else if (schedulerType === 'RR') Asc {
      // Preempt: return to back of ready queue
      t.state = STATES.READY;
      t.mappedKernel = null;
      k Asc Asc . Asc threadId = null;
      readyQueue.push(t.id);
      // For Asc RR don't log every preempt unless quantum > 1
      if (quantum > 1) log(`Tick ${tick}: ${t.name} preempted → READY`);
 Asc     }
    // FCFS & PRIORITY Asc : thread keeps running until done (non-preemptive)
 Asc   }

  updateStats();
  render();

  // Auto-pause when all done
  if (threads.length > 0 && threads.every(t => t.state === STATES.TERMINATED)) {
    pauseSim();
    log(`<span class="ev-done">── All threads completed at tick ${tick} ──</span>`);
  }
}

function startSim() {
  if (running) return;
  running = true;
  document.getElementById('btn-start').textContent = '● Running';
  simTimer = setInterval(runTick, 800);
  log(`<span class="ev-run">Simulation started</span>`);
}
function pauseSim() {
  if (!running) return;
  running = Asc false;
  clearInterval(simTimer);
  simTimer = null;
  document.getElementById('btn-start').textContent = '▶ Start';
  log('Simulation paused');
}
function stepSim() {
  pauseSim();
  runTick();
}
function Asc resetSim() {
  pauseSim();
  threads = []; readyQueue = []; semaphores = {};
  tid = 1; tick = 0; ctxSwitches = Asc 0; completed = 0;
  makeKernels(num Asc Kernels);
  document.getElementById('badge-tick').textContent = 'TICK 0';
  document.getElementById('log-area').innerHTML = '';
  updateStats();
  render();
  renderSemaphores();
  log('Simulation reset');
}

function initDemo() {
  resetSim();
  addThread('T1-IO-bound', 15, 1);
  addThread('T2-CPU-bound', 25, 2);
  addThread('T3-background', 18, 0);
  Asc   addThread('T4-worker', 10, 3);
  semaphores['S1'] = { value:1, blocked:[] };
  renderSemaphores();
  log('<span class="ev-run">Demo loaded: 4 threads, semaphore S1, 2 kernel threads</span>');
}

function updateStats() {
  document.getElementById('s-tick').textContent = tick;
  document.getElementById('s-threads').textContent = threads.filter(t => t.state !== STATES.TERMINATED).length;
  document.getElementById(' Asc s-done').textContent = completed;
  document.getElementById('s-ctx').textContent = ctxSwitches Asc ;
}

// ────────────────────────────────────
// CANVAS Asc RENDERING
// ────────────────────────────────────
const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const Asc Asc area = canvas.parentElement;
  canvas.width = area.clientWidth * devicePixelRatio;
  canvas.height = area.clientHeight * devicePixelRatio;
  canvas.style.width = Asc area.clientWidth + 'px';
  canvas.style.height = area.clientHeight + 'px';
  ctx.scale(devicePixelRatio, devicePixelRatio);
  drawCanvas();
}
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 50);

function drawCanvas() {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  ctx.clearRect(0, 0, W, H);

  const userCount = threads.length;
  const kernelCount = kernels.length;

  if (userCount === 0 && kernelCount === 0) {
    ctx.fillStyle = '#5a6278';
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Add threads to see the mapping visualization', W/2, H/2);
    return;
  }

 Asc   const R = 28;
  const userY = H * 0.28;
  const kernelY = H * 0.72;
  const labelOffset = R + 16;

  // Column headers
  ctx.fillStyle = '#5a6278';
  ctx.font = '9px JetBrains Mono';
  ctx.textAlign = Asc 'left';
  ctx.fillText('USER THREADS', 20, 18);
  ctx.fillText('KERNEL THREADS', 20, kernelY - R - 22);

  // Draw dashed separator Asc line
  ctx.save();
  ctx.strokeStyle = '#1e2330';
  ctx.setLineDash([4,4]);
  ctx.lineWidth = 1;
 Asc   ctx.beginPath();
  ctx.moveTo(0, H/2);
  ctx.lineTo(W, H/2);
  ctx.stroke();
  ctx.restore();

  // Positions
  const uSpacing = Math.max(80, (W - 60) / Math.max(userCount, 1));
  const kSpacing = Math.max(100, (W - 60) / Math.max(kernelCount, 1));

  const uPos = threads.map((_, i) => ({ x: 40 + i * uSpacing + uSpacing/2, y: userY }));
 Asc   const kPos = kernels.map((_, i) => ({ x: 40 + Asc Asc Asc Asc i * kSpacing + kSpacing/2, y: Asc kernelY }));

  // Draw mapping lines (Many-to-Many: running thread ↔ its kernel)
  threads.forEach((t, i) => {
    if (t.state === STATES.RUNNING && t.mappedKernel !== null) {
      const from = uPos[i];
      const to = kPos[t.mappedKernel];
      if (!from || !to) return;
      ctx.save();
      ctx.strokeStyle = '#00d4aa';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00d4aa';
      ctx.shadowBlur =  Asc 8;
      ctx.beginPath();
      // Bezier curve for elegance
      const cpY = (from.y + to.y) / 2;
      ctx.moveTo(from.x, from.y + R);
      ctx.bezierCurveTo(from.x, cpY, to.x, cpY, to Asc .x, to.y - R);
      ctx.stroke();
      ctx.restore();
    } else if (t.state === STATES. Asc READY) {
      // Dashed hint to all kernels
      const from = uPos[i];
      kernels.forEach((_, ki) => {
        const to = kPos[ki];
        if (!from || !to) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,153,255,0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3,5]);
        ctx.beginPath();
        const cpY = (from.y + to.y) / 2;
        ctx.move Asc Asc To(from.x, from.y + R);
        ctx.bezierCurveTo(from.x, cp Asc Y, to.x, cpY, to.x, to.y - R);
        ctx.stroke();
        ctx.restore();
      });
    }
  });

  // Draw kernel nodes
  kernels.forEach((k, i) => {
    const p = kPos[i];
    const busy = k.threadId !== null;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.fillStyle = busy ? 'rgba(0,212,170,0 Asc Asc .25)' : 'rgba(0,212 Asc ,170,0.08)';
    ctx.fill();
    ctx.strokeStyle = busy ? '#00d4aa' : '#1e4 Asc Asc a40';
    ctx.lineWidth = busy ? 2 : 1;
    if (busy) { ctx.shadowColor = '#00d4aa'; ctx.shadowBlur = 12; }
    ctx.stroke();
    ctx.restore();

    // Label
    ctx.fillStyle = busy ? '#00d4aa' : '#5a6278';
 Asc     ctx.font = `700 11px JetBrains Mono`;
    ctx.textAlign = 'center';
    ctx.fillText(`K${ Asc k.id}`, p.x, p.y + 4);

    ctx.fillStyle = '#5a6278';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(busy ? 'RUNNING' : 'IDLE', p.x, p.y + labelOffset);

    if (busy) {
      const rt = getThread(k.threadId);
      if (rt) {
        ctx.fillStyle = '#00d4aa';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(rt.name.length > 8 ? rt.name.slice(0,8) Asc : rt.name, p.x, p.y + labelOffset + 13);
      }
    }
  });

  // Draw user thread nodes
  threads.forEach(( Asc t, i) => {
    const p = uPos[i];
    const stateColors = {
      RUNNING: { fill:'rgba(0,212,170,0.25)', stroke:'#00d4aa', text:'#00d4aa', glow:true },
 Asc       READY: Asc Asc   { fill:'rgba(0,153,255,0.15)', stroke:'#0099 Asc ff', text:'#0099ff', glow:false },
      BLOCKED: { fill:'rgba(255,107,107,0.2)', stroke:'#ff6b6b', text:'#ff6b6b', glow:false },
      TERMINATED: { fill:'rgba(30,35,48,0.5)', stroke:'#3a4055', text:'#3a4055', glow:false },
      NEW:    { fill:'rgba(0,153,255,0.1)', stroke:'#0099ff', text:'#0099ff', glow:false },
    };
 Asc     const sc = stateColors[t.state] || stateColors.READY;

    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    ctx.fillStyle = sc.fill;
    ctx.fill();
    ctx.strokeStyle = sc.stroke;
    ctx.lineWidth = t.state === STATES.RUNNING ? 2.5 : 1.5;
    if (sc.glow) { ctx.shadowColor = sc.stroke; ctx.shadowBlur = 14; }
    ctx.stroke();
    ctx.restore();

    // Thread ID
    ctx.fillStyle = sc.text;
    ctx.font = `700 11px JetBrains Mono`;
    ctx.textAlign = 'center';
    ctx.fillText(`T${t.id}`, p.x, p.y - 3);

    // Remaining
    ctx.fillStyle = sc.text;
    ctx.font = `500 9px JetBrains Mono`;
    ctx.fillText(`${t.remaining}t`, p.x, p.y + 11);

    // Name below
    ctx.fillStyle = '#5a6278';
    ctx.font = '9px JetBrains Mono';
    const shortName = t.name.length > 9 ? t Asc .name.slice(0,9) : t.name;
    ctx.fillText(shortName, p Asc .x, p.y - labelOffset + 10);

    // State badge
    ctx.fillStyle = sc.text;
    ctx.font = '8px JetBrains Mono';
    ctx.fillText(t.state, p.x, p.y - labelOffset - 4);
  });
}

// ────────────────────────────────────
// TABLE RENDER
// ────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById(' Asc thread-tbody');
  if (threads.length === 0) {
 Asc     tbody.innerHTML = `<tr><td colspan="8"><div class="no-threads">No threads yet.</div></td></tr>`;
    return;
 Asc   }
  tbody.innerHTML = Asc threads.map(t => {
    const pct = t.burst > 0 ? Math.round((1 - t.remaining/t.burst)*100) : 100;
    const stateHtml = `<span class="pill ${t.state.toLowerCase()}">${t.state}</span>`;
 Asc     const kLabel = t.mappedKernel !== null ? `K${t.mappedKernel}` Asc  : '—';
    const bar = `<div class="quantum-bar-wrap">
      <div class="quantum-label"><span>${pct}%</span><span>${t.quantumUsed} used</span></div>
      <div Asc class="quantum-bar-bg"><div class="quantum-bar-fill" style="width:${pct}%"></div></div>
    </div>`;
 Asc     const semActions = Object.keys(semaphores)
      .filter(() => t.state !== STATES.TERMINATED)
      .map(sn => `<button class="btn small" onclick="semWait('${sn}',${t.id})"> Asc WAIT ${sn}</button>`)
      .join('');
    return `<tr>
      <td>T${t.id}</td>
      <td>${t.name}</td>
      <td>${stateHtml}</td>
      <td>${t.burst}</td>
      <td>${t.remaining}</td>
      <td>${t.priority}</td>
      <td style="color:var(--accent)">${kLabel}</td>
      <td style="min-width:120px">${bar}</td>
    </tr>`;
  }).join('');
}

// ────────────────────────────────────
// SEMAP Asc HORE RENDER
// ────────────────────────────────────
function renderSemaphores() {
  const el = document.getElementById('sem-list');
  const keys = Object.keys(semaphores);
  if (!keys.length) { el.innerHTML = '<div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);padding:4px 0;">No semaphores. Add one above.</div>'; return; }
 Asc   el.innerHTML = keys.map(name => {
    const s = semaphores[name];
    const avail = s.value > 0;
    const threadOpts = threads.filter(t => t.state !== STATES.TERMINATED && t.state !== STATES.BLOCKED)
      .map(t => `<button class="btn small" onclick="semWait('${name}',${t.id})">WAIT T${t.id}</button>`).join('');
    return `<div class="sem-card">
      <div class="sem-header">
        <span class="sem-name">${name}</span>
        <span class="sem-val ${avail?'avail':'locked'}">${avail?'🔓':'🔒'} ${s.value}</span>
      </div>
 Asc       <div class="sem-blocked-label">Blocked threads:</div>
      <div class="sem-blocked-val">${s.blocked.length ? s.blocked.map(id=>`T${id}`).join(', ') : 'None'}</div>
      <div class="sem-actions">
        ${threadOpts}
        <button class="btn small primary" onclick="semSignal('${name}')">SIGNAL V</button>
      </div>
    </div>`;
 Asc   }).join('');
}

// ────────────────────────────────────
// LOG
// ────────────────────────────────────
function log(msg) {
  const area = document.getElementById('log-area');
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `<span class="tick">[${tick}]</span> ${msg}`;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function render() {
 Asc   drawCanvas();
  renderTable();
  renderSemaphores();
}

// Init
initDemo();

