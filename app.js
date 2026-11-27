(function () {
  'use strict';

  var TEAMS = ['海港', '国安', '泰山', '申花', '蓉城', '津门虎'];

  // 初始示例数据（点“恢复初始数据”会回到这里）
  var DEFAULT_MATCHES = [
    { id: 1, date: '2026-08-01', home: '海港', away: '国安', homeScore: 2, awayScore: 1, played: true },
    { id: 2, date: '2026-08-02', home: '泰山', away: '申花', homeScore: 0, awayScore: 0, played: true },
    { id: 3, date: '2026-08-03', home: '蓉城', away: '津门虎', homeScore: 3, awayScore: 2, played: true },
    { id: 4, date: '2026-08-08', home: '海港', away: '泰山', homeScore: 1, awayScore: 1, played: true },
    { id: 5, date: '2026-08-09', home: '国安', away: '蓉城', homeScore: 2, awayScore: 0, played: true },
    { id: 6, date: '2026-08-10', home: '申花', away: '海港', homeScore: 1, awayScore: 3, played: true },
    { id: 7, date: '2026-12-05', home: '津门虎', away: '国安', homeScore: null, awayScore: null, played: false },
    { id: 8, date: '2026-12-06', home: '泰山', away: '蓉城', homeScore: null, awayScore: null, played: false },
    { id: 9, date: '2026-12-07', home: '申花', away: '津门虎', homeScore: null, awayScore: null, played: false }
  ];

  var STORAGE_KEY = 'football-matches-v1';

  var state = { team: 'all', status: 'all' };

  function clone(list) {
    return list.map(function (m) {
      return {
        id: m.id,
        date: m.date,
        home: m.home,
        away: m.away,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        played: m.played
      };
    });
  }

  function isTeam(name) {
    return TEAMS.indexOf(name) !== -1;
  }

  function isValidStoredMatch(m) {
    return m
      && typeof m.date === 'string'
      && isTeam(m.home)
      && isTeam(m.away)
      && m.home !== m.away
      && (m.played === true || m.played === false)
      && (m.played === false || (typeof m.homeScore === 'number' && typeof m.awayScore === 'number'));
  }

  function loadMatches() {
    try {
      var raw = window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return clone(DEFAULT_MATCHES);
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return clone(DEFAULT_MATCHES);
      var valid = parsed.filter(isValidStoredMatch);
      return valid.length ? valid : clone(DEFAULT_MATCHES);
    } catch (e) {
      return clone(DEFAULT_MATCHES);
    }
  }

  function saveMatches(list) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      // 隐私模式或存储已满时忽略，页面仍可正常使用
    }
  }

  var matches = loadMatches();

  function nextId() {
    return matches.reduce(function (max, m) { return Math.max(max, m.id || 0); }, 0) + 1;
  }

  function today() {
    var d = new Date();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + month + '-' + day;
  }

  // 纯函数：按球队和状态筛选比赛
  function filterMatches(list, team, status) {
    return list.filter(function (m) {
      var teamOk = team === 'all' || m.home === team || m.away === team;
      var statusOk = status === 'all'
        || (status === 'played' && m.played === true)
        || (status === 'upcoming' && m.played === false);
      return teamOk && statusOk;
    });
  }

  // 纯函数：根据已结束的比赛计算积分榜
  function computeStandings(list, teams) {
    var table = {};
    teams.forEach(function (name) {
      table[name] = { team: name, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0 };
    });

    list.filter(function (m) { return m.played === true; }).forEach(function (m) {
      var home = table[m.home];
      var away = table[m.away];
      if (!home || !away) return;

      home.played += 1;
      away.played += 1;
      home.gf += m.homeScore;
      home.ga += m.awayScore;
      away.gf += m.awayScore;
      away.ga += m.homeScore;

      if (m.homeScore > m.awayScore) {
        home.win += 1;
        away.loss += 1;
      } else if (m.homeScore < m.awayScore) {
        away.win += 1;
        home.loss += 1;
      } else {
        home.draw += 1;
        away.draw += 1;
      }
    });

    var rows = teams.map(function (name) { return table[name]; });
    rows.forEach(function (row) {
      row.points = row.win * 3 + row.draw;
      row.diff = row.gf - row.ga;
    });

    rows.sort(function (a, b) {
      if (b.points !== a.points) return b.points - a.points;
      if (b.diff !== a.diff) return b.diff - a.diff;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team, 'zh');
    });

    rows.forEach(function (row, index) { row.rank = index + 1; });
    return rows;
  }

  function formatScore(m) {
    return m.played ? m.homeScore + ' : ' + m.awayScore : '—';
  }

  function render() {
    var visible = filterMatches(matches, state.team, state.status);
    visible.sort(function (a, b) {
      return a.date === b.date ? a.id - b.id : a.date.localeCompare(b.date);
    });

    var listEl = document.getElementById('matchList');
    var countEl = document.getElementById('matchCount');
    var emptyEl = document.getElementById('emptyHint');

    listEl.innerHTML = visible.map(function (m) {
      return '<li class="match">' +
        '<span class="date">' + m.date + '</span>' +
        '<span class="team home">' + m.home + '</span>' +
        '<span class="score">' + formatScore(m) + '</span>' +
        '<span class="team away">' + m.away + '</span>' +
        '<span class="badge ' + (m.played ? 'done' : 'soon') + '">' +
          (m.played ? '已结束' : '未开始') +
        '</span>' +
      '</li>';
    }).join('');

    countEl.textContent = '共 ' + visible.length + ' 场';
    emptyEl.hidden = visible.length !== 0;

    renderStandings();
  }

  function renderStandings() {
    var rows = computeStandings(matches, TEAMS);
    var body = document.getElementById('standingsBody');

    body.innerHTML = rows.map(function (r) {
      var diff = r.diff > 0 ? '+' + r.diff : String(r.diff);
      return '<tr>' +
        '<td class="rank">' + r.rank + '</td>' +
        '<td class="team-name">' + r.team + '</td>' +
        '<td>' + r.played + '</td>' +
        '<td>' + r.win + '</td>' +
        '<td>' + r.draw + '</td>' +
        '<td>' + r.loss + '</td>' +
        '<td>' + r.gf + '</td>' +
        '<td>' + r.ga + '</td>' +
        '<td>' + diff + '</td>' +
        '<td class="pts">' + r.points + '</td>' +
      '</tr>';
    }).join('');
  }

  function fillTeamOptions(selectId) {
    var select = document.getElementById(selectId);
    TEAMS.forEach(function (team) {
      var option = document.createElement('option');
      option.value = team;
      option.textContent = team;
      select.appendChild(option);
    });
  }

  function showMessage(kind, text) {
    var el = document.getElementById('formMessage');
    if (!el) return;
    el.textContent = text;
    el.className = 'form-msg ' + kind;
    el.hidden = false;
  }

  function readScore(inputId) {
    var raw = String(document.getElementById(inputId).value).trim();
    if (raw === '') return { ok: false, message: '请把两队比分都填上（0 也算，必须写 0）。' };
    if (!/^\d{1,2}$/.test(raw)) return { ok: false, message: '比分只能是 0–99 之间的整数，不能是负数或小数。' };
    return { ok: true, value: Number(raw) };
  }

  function addMatchFromForm() {
    var home = document.getElementById('homeTeam').value;
    var away = document.getElementById('awayTeam').value;
    var dateEl = document.getElementById('matchDate');

    if (!home || !away) return { ok: false, message: '请选择主队和客队。' };
    if (home === away) return { ok: false, message: '主队和客队不能是同一支球队。' };

    var homeScore = readScore('homeScore');
    if (!homeScore.ok) return homeScore;

    var awayScore = readScore('awayScore');
    if (!awayScore.ok) return awayScore;

    var date = dateEl.value || today();

    matches.push({
      id: nextId(),
      date: date,
      home: home,
      away: away,
      homeScore: homeScore.value,
      awayScore: awayScore.value,
      played: true
    });
    saveMatches(matches);
    render();

    return {
      ok: true,
      message: '已添加：' + date + ' ' + home + ' ' + homeScore.value + ' : ' + awayScore.value + ' ' + away + '，积分榜已更新。'
    };
  }

  function resetMatches() {
    if (window.confirm && !window.confirm('确定恢复初始的 9 场比赛？你添加的比赛会被删除。')) {
      return null;
    }
    matches = clone(DEFAULT_MATCHES);
    try {
      if (window.localStorage) window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // 忽略存储异常
    }
    render();
    return { ok: true, message: '已恢复初始数据。' };
  }

  function bindEvents() {
    document.getElementById('teamFilter').addEventListener('change', function (event) {
      state.team = event.target.value;
      render();
    });

    document.getElementById('statusFilter').addEventListener('change', function (event) {
      state.status = event.target.value;
      render();
    });

    document.getElementById('matchForm').addEventListener('submit', function (event) {
      if (event.preventDefault) event.preventDefault();
      var result = addMatchFromForm();
      showMessage(result.ok ? 'ok' : 'error', result.message);
      if (result.ok) {
        document.getElementById('homeScore').value = '';
        document.getElementById('awayScore').value = '';
      }
    });

    document.getElementById('resetBtn').addEventListener('click', function () {
      var result = resetMatches();
      if (result) showMessage(result.ok ? 'ok' : 'error', result.message);
    });
  }

  fillTeamOptions('teamFilter');
  fillTeamOptions('homeTeam');
  fillTeamOptions('awayTeam');

  // 默认主客队不要是同一支
  document.getElementById('homeTeam').value = TEAMS[0];
  document.getElementById('awayTeam').value = TEAMS[1];

  var dateInput = document.getElementById('matchDate');
  if (dateInput && !dateInput.value) dateInput.value = today();

  bindEvents();
  render();

  // 暴露给测试脚本和后续版本使用
  window.FootballApp = {
    TEAMS: TEAMS,
    DEFAULT_MATCHES: DEFAULT_MATCHES,
    filterMatches: filterMatches,
    computeStandings: computeStandings,
    addMatchFromForm: addMatchFromForm,
    resetMatches: resetMatches,
    state: state,
    render: render,
    getMatches: function () { return matches; }
  };
})();
