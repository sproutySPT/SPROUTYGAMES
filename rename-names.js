// rename-names.js
// 같은 폴더 안의 텍스트 파일들에서 이름을 일괄 치환합니다.
//   이정후 → 전레디(Ex-Rad)
//   정지호 → 정새싹(SPROUTY)
//
// 사용법:
//   1) 이 파일을 index.html 등이 들어있는 폴더에 넣기
//   2) 터미널에서 그 폴더로 이동
//   3) node rename-names.js 실행
//
// 주의: 이미지/영상 등 바이너리 파일은 건드리지 않고, 아래 TEXT_EXT 확장자만 처리합니다.
//       하위 폴더는 뒤지지 않고 같은 폴더의 파일만 처리합니다 (RECURSIVE를 true로 바꾸면 하위 폴더도 처리).

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const RECURSIVE = false; // 하위 폴더까지 처리하려면 true로 변경

// 치환 규칙 (긴 패턴부터, 순서대로 적용)
const REPLACEMENTS = [
  ['이정후', '전레디(Ex-Rad)'],
  ['정지호', '정새싹(SPROUTY)'],
];

// 처리할 텍스트 파일 확장자
const TEXT_EXT = new Set(['.html', '.htm', '.js', '.css', '.json', '.txt', '.md', '.xml', '.svg']);

function isTextFile(filename) {
  return TEXT_EXT.has(path.extname(filename).toLowerCase());
}

function processFile(fullPath, label) {
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf-8');
  } catch (e) {
    console.log(`⚠️  읽기 실패, 건너뜀: ${label} (${e.message})`);
    return false;
  }

  let updated = content;
  for (const [oldStr, newStr] of REPLACEMENTS) {
    updated = updated.split(oldStr).join(newStr);
  }

  if (updated !== content) {
    fs.writeFileSync(fullPath, updated, 'utf-8');
    console.log(`✅ 수정됨: ${label}`);
    return true;
  }
  return false;
}

function walk(dir, base) {
  let changed = 0;
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const label = path.relative(base, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (RECURSIVE) changed += walk(fullPath, base);
      continue;
    }
    if (fullPath === __filename) continue; // 스크립트 자기 자신은 건너뜀
    if (!isTextFile(file)) continue;

    if (processFile(fullPath, label)) changed++;
  }
  return changed;
}

const changedFiles = walk(DIR, DIR);
console.log(`\n총 ${changedFiles}개 파일 수정 완료.`);
if (changedFiles === 0) {
  console.log('(수정된 파일이 없습니다 — 이미 다 바뀌었거나, 폴더 위치를 확인해보세요.)');
}
