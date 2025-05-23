const demoConfig = {
  html: `// Documentation of the options is available at https://github.com/terser/html-minifier-terser?tab=readme-ov-file#options-quick-reference

{
    caseSensitive                : false,
    collapseBooleanAttributes    : true,
    collapseInlineTagWhitespace  : false,
    collapseWhitespace           : true,
    conservativeCollapse         : false,
    continueOnParseError         : false,
    customAttrAssign             : [],
    customAttrCollapse           : undefined,
    customAttrSurround           : [],
    customEventAttributes        : [/^on[a-z]{3,}$/],
    decodeEntities               : true,
    html5                        : true,
    ignoreCustomComments         : [/^!/, /^\\s*#/],
    ignoreCustomFragments        : [/<%[\s\\S]*?%>/, /<\\?[\\s\\S]*?\\?>/],
    includeAutoGeneratedTags     : true,
    keepClosingSlash             : false,
    maxLineLength                : undefined,
    // ↓ could be false, Object, Function(text, type)
    minifyCSS                    : true,
    // ↓ could be false, Object, Function(text, inline)
    minifyJS                     : true,
    // ↓ could be String, Object, Function(text)
    minifyURLs                   : false,
    noNewlinesBeforeTagClose     : false,
    preserveLineBreaks           : false,
    preventAttributesEscaping    : false,
    processConditionalComments   : true,
    processScripts               : ["text/html"],
    quoteCharacter               : undefined, // ' or "
    removeAttributeQuotes        : false,
    removeComments               : true,
    // ↓ could be false, Function(attrName, tag)
    removeEmptyAttributes        : true,
    removeEmptyElements          : false,
    removeOptionalTags           : true,
    removeRedundantAttributes    : true,
    removeScriptTypeAttributes   : true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace          : false,
    sortAttributes               : false,
    sortClassName                : false,
    trimCustomFragments          : false,
    useShortDoctype              : true
}`,
  javascript: `// Documentation of the options is available at https://terser.org/docs/options/

{
  parse: {
    bare_returns  : false,
    html5_comments: true,
    shebang       : true,
    spidermonkey  : false
  },
  ecma           : 5,
  enclose        : false,
  keep_classnames: false,
  keep_fnames    : false,
  ie8            : false,
  module         : false,
  nameCache      : null,
  safari10       : false,
  toplevel       : false
}`,
  css: `// Documentation of the options is available at https://github.com/clean-css/clean-css?tab=readme-ov-file#constructor-options

{
  level: {
    1: {
      all: true,
      normalizeUrls: false
    },
    2: {
      restructureRules: true
    }
  }
}`
};

const headerLink = document.getElementById("header-link");

const $in = document.getElementById("in");
const $op = document.getElementById("op");
const $out = document.getElementById("out");
const $err = document.getElementById("error");

const optionButton = document.getElementById("btn-options");
const minifyButton = document.getElementById("btn-go");

const saveButton = document.getElementById("btn-options-save");
const resetButton = document.getElementById("btn-options-reset");

let curCodeType = null;
let configEditMode = false;
let curConfig = {
  html: getOpt(localStorage.getItem("htmlOptions") || demoConfig.html),
  javascript: getOpt(localStorage.getItem("javascriptOptions") || demoConfig.javascript),
  css: getOpt(localStorage.getItem("cssOptions") || demoConfig.css)
};

headerLink.onclick = () => {
  show("input");
  hide("option");
  hide("c2");
  hide("c3");
  show("c4");
  return false;
};

document.querySelectorAll("div.type > input").forEach(el => {
  el.onchange = evt => {
    if (configEditMode) {
      configEditMode = evt.target.value;
      $op.value = localStorage.getItem(configEditMode + "Options") || demoConfig[configEditMode];
    } else curCodeType = evt.target.value;
  };
});

optionButton.onclick = () => {
  hide("input");
  show("option");
  configEditMode = curCodeType || "html";
  if (!curCodeType) {
    document.querySelector(`div.type > input[value=${configEditMode}]`).checked = true;
  }
  $op.value = localStorage.getItem(configEditMode + "Options") || demoConfig[configEditMode];
};

minifyButton.onclick = async () => {
  let val = $in.value;
  try {
    if (!val.trim()) return;
    minifyButton.disabled = true;
    let outputContent = await minify(curCodeType || "html", val);
    if (outputContent) {
      $out.value = outputContent;
      const diff = val.length - outputContent.length;
      const savings = val.length ? ((100 * diff) / val.length).toFixed(2) : 0;
      document.querySelector("div.stats").innerText = `Original Size: ${val.length} bytes, Minfied Size: ${outputContent.length} bytes, Savings: ${savings}%`;
      show("c2");
      hide("c3");
      hide("c4");
    }
  } catch (e) {
    showError(e);
  } finally {
    minifyButton.disabled = false;
  }
};

saveButton.onclick = () => {
  if (!setOpt()) return;
  hide("option");
  show("input");
  hide("c2");
  hide("c3");
  show("c4");
  let needRefresh = configEditMode === curCodeType;
  configEditMode = false;
  if (!curCodeType) radioUncheckAll();
  else {
    document.querySelector(`div.type > input[value=${curCodeType}]`).checked = true;
    needRefresh && minifyButton.click();
  }
};

resetButton.onclick = () => {
  let keyName = configEditMode + "Options";
  localStorage.removeItem(keyName);
  curConfig[configEditMode] = getOpt(demoConfig[configEditMode]);
  hide("option");
  show("input");
  hide("c2");
  hide("c3");
  show("c4");
  let needRefresh = configEditMode === curCodeType;
  configEditMode = false;
  if (!curCodeType) radioUncheckAll();
  else {
    document.querySelector(`div.type > input[value=${curCodeType}]`).checked = true;
    needRefresh && minifyButton.click();
  }
};

$in.oninput = () => {
  let val = $in.value.trim();
  if (!val) {
    radioUncheckAll();
    curCodeType = null;
  } else {
    let type = detect(val);
    curCodeType = type;
    if (type) {
      document.querySelector(`div.type > input[value=${type}]`).checked = true;
    } else radioUncheckAll();
  }
};

async function minify(type = "html", input) {
  let config,
    randomScriptTag = "ltscripttag" + Date.now() + "gt";
  switch (type) {
    case "javascript":
      input = input.replace(/<\s*?\/\s*?script\s*?>/g, randomScriptTag);
      input = `<script>${input}</script>`;
      config = Object.assign({}, getOpt(demoConfig.html), { minifyJS: curConfig.javascript });
      break;
    case "css":
      input = `<style>${input}</style>`;
      config = Object.assign({}, getOpt(demoConfig.html), { minifyCSS: curConfig.css });
      break;
    case "html":
      config = curConfig.html;
    default:
      break;
  }
  let result = await HTMLMinifier.minify(input, config);
  return type === "javascript"
    ? result
        .replace(/^<script>/, "")
        .replace(/<\/script>$/, "")
        .replace(new RegExp(randomScriptTag, "g"), "</script>")
    : type === "css"
    ? result.replace(/^<style>/, "").replace(/<\/style>$/, "")
    : result;
}

function detect(code) {
  code = code.trim();
  if (/^<!DOCTYPE|^<!--|^<html|^<head|^<body|^<\w+/.test(code)) return "html";
  if (/\b(function|var|const|let|if|else|for|while|return|class|async|await|import|export|try|catch|new|=>)\b/.test(code)) return "javascript";
  if (!/:\s*[^;]+;/.test(code)) {
    try {
      new Function(code);
      return "javascript";
    } catch (_) {}
  }
  let ifCssWithoutComments = code.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (/(@media|@keyframes|[.#]?\w[\w\s>:#.\[\]*="'-]*\s*{[^{}]*})/.test(ifCssWithoutComments)) return "css";
  return null;
}

function radioUncheckAll() {
  document.querySelectorAll("div.type > input").forEach(e => {
    e.checked = false;
  });
}

function getOpt(value) {
  /*jshint evil:true */
  return new Function("return (" + (value || $op.value) + ");")();
}

function setOpt() {
  let oldOpt = curConfig[configEditMode];
  try {
    curConfig[configEditMode] = getOpt();
    try {
      if (demoConfig[configEditMode] === $op.value) localStorage.removeItem(configEditMode + "Options");
      else localStorage.setItem(configEditMode + "Options", $op.value);
    } catch (e) {}
    return true;
  } catch (e) {
    curConfig[configEditMode] = oldOpt;
    showError(e);
    return false;
  }
}

function showError(e) {
  console.error("Error", e);
  hide("c2");
  show("c3");
  hide("c4");

  $err.innerHTML = encodeHTML(e.message);
}

function encodeHTML(str) {
  return (str + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function hide(className) {
  document.querySelector("div." + className).classList.add("hide");
}

function show(className) {
  document.querySelector("div." + className).classList.remove("hide");
}
