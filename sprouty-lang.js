/* ════════════════════════════════════════════════════
   sprouty-lang.js — 게임 페이지용 언어 연동 (index.html 과 같은 규칙)

   ▸ 넣는 법: 각 게임 HTML 의 <head> 맨 위에 한 줄
       <script src="/sprouty-lang.js"></script>
     (홈과 같은 도메인의 루트에 이 파일을 올려 두세요)

   ▸ 쓰는 법
       SPROUTY.lang                          → 'ko' 또는 'en'
       SPROUTY.t({ ko: '시작', en: 'START' }) → 현재 언어 문구
       SPROUTY.onChange(lang => { ... })     → 언어가 바뀔 때(다른 탭 포함) 다시 그리기
       SPROUTY.set('en')                     → 게임 안에 언어 버튼을 만들 때. 홈에도 같이 반영됨
       SPROUTY.BRAND                         → { ko:'정새싹게임즈', en:'SPROUTY GAMES', abbr:'SPTG' }

   ▸ 언어를 정하는 순서
       1) 주소의 ?lang=ko|en  (홈에서 게임을 열 때 자동으로 붙여 줌)
       2) localStorage 'sprouty_lang' (홈과 같은 도메인이면 공유됨)
       3) 브라우저 언어: 한국어가 하나라도 있으면 ko, 아니면 en (검색엔진 봇은 ko)
   ════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var KEY = 'sprouty_lang';
  var BRAND = { ko: '정새싹게임즈', en: 'SPROUTY GAMES', abbr: 'SPTG' };
  var handlers = [];

  function valid(v){ return v === 'ko' || v === 'en'; }

  function detect(){
    try{
      if(/bot|crawl|spider|slurp|yeti|daum|naver|lighthouse/i.test(navigator.userAgent)) return 'ko';
      var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
      for(var i = 0; i < langs.length; i++){ if(/^ko\b/i.test(langs[i])) return 'ko'; }
      return 'en';
    }catch(e){ return 'ko'; }
  }

  function read(){
    try{
      var q = new URLSearchParams(location.search).get('lang');
      if(valid(q)) return q;
    }catch(e){}
    try{
      var s = localStorage.getItem(KEY);
      if(valid(s)) return s;
    }catch(e){}
    return detect();
  }

  var api = {
    BRAND: BRAND,
    lang: read(),
    t: function(map){
      if(map == null) return '';
      var v = map[api.lang];
      return v != null ? v : (map.ko != null ? map.ko : map.en);
    },
    onChange: function(fn){
      if(typeof fn === 'function') handlers.push(fn);
    },
    set: function(lang){
      if(!valid(lang) || lang === api.lang) return;
      try{ localStorage.setItem(KEY, lang); }catch(e){}
      change(lang);
    }
  };

  function change(lang){
    api.lang = lang;
    document.documentElement.lang = lang;
    for(var i = 0; i < handlers.length; i++){
      try{ handlers[i](lang); }catch(e){ if(window.console) console.warn('[SPROUTY.onChange]', e); }
    }
  }

  document.documentElement.lang = api.lang;

  // 홈이나 다른 탭에서 언어를 바꾸면 이 페이지도 따라감
  window.addEventListener('storage', function(e){
    if(e.key === KEY && valid(e.newValue) && e.newValue !== api.lang) change(e.newValue);
  });

  window.SPROUTY = api;
})();
