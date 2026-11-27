(function () {
  'use strict';

  // 示例球队与赛程数据（v0.1 内置，后续版本会支持自己录入比赛）
  var TEAMS = ['海港', '国安', '泰山', '申花', '蓉城', '津门虎'];

  var MATCHES = [
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

  var state = { team: 'all', status: 'all' };

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

  function formatScore(m) {
    return m.played ? m.homeScore + ' : ' + m.awayScore : '—';
  }

  function render() {
    var visible = filterMatches(MATCHES, state.team, state.status);
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
  }

  function fillTeamOptions() {
    var select = document.getElementById('teamFilter');
    TEAMS.forEach(function (team) {
      var option = document.createElement('option');
      option.value = team;
      option.textContent = team;
      select.appendChild(option);
    });
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
  }

  fillTeamOptions();
  bindEvents();
  render();

  // 暴露给测试脚本和后续版本使用
  window.FootballApp = {
    TEAMS: TEAMS,
    MATCHES: MATCHES,
    filterMatches: filterMatches,
    state: state,
    render: render
  };
})();
