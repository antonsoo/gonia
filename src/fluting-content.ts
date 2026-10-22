export const flutingSources = [
  {
    file: "krohn-085.jpg",
    label: "Doric · Krohn (1912), p. 85",
    url: "https://archive.org/details/vitruviidearchit00vitr_1/page/85/mode/1up",
    note: "IV.3.9. Square, compass and twenty divisions. The complete page retains the critical apparatus.",
    width: 1414,
    height: 2200,
    sha256: "578319267f93db72bad9ba1b19bf65afae5d69a7cdcbc8de2daa09e316b10f6a",
  },
  {
    file: "krohn-074.jpg",
    label: "Ionic · Krohn (1912), p. 74",
    url: "https://archive.org/details/vitruviidearchit00vitr_1/page/74/mode/1up",
    note: "III.5.14. XXIIII flutes and the norma. Krohn marks 〈angulos〉 as a supplement; his apparatus credits Jocundus.",
    width: 1414,
    height: 2200,
    sha256: "a4da2fcc5b8e59c7f122e1bbd2140844661003147d06d2e37e89571e062dc2c5",
  },
  {
    file: "bywater-205.jpg",
    label: "Greek · Bywater, 1920 printing, p. 205",
    url: "https://archive.org/details/aristotelis00aristuoft/page/205/mode/1up",
    note: "Nicomachean Ethics X.4, 1174a23–24. The clause starts midway down the page, with ἡ γὰρ τῶν λίθων. This discusses different building activities, not flute geometry.",
    width: 1419,
    height: 2200,
    sha256: "2a569b9f39ff932f61b1582477ec75aae91d29e3de730f70c051271624318657",
  },
] as const;
export const doricLatin =
  "in medio autem quadrato circini centrum conlocetur et agatur linea rotundationis, quae quadrationis angulos tangat";
export const ionicLatin = "cacumenque normae circum rotundationem tangendo pervagari possit";
export const greekFluting = "ἡ γὰρ τῶν λίθων σύνθεσις ἑτέρα τῆς τοῦ κίονος ῥαβδώσεως";
export function readingContent(): string {
  return `<section id="fluting-reading" class="fluting-section"><p class="eyebrow">Read the instructions</p><h2>A compass and a carpenter’s square.</h2><div class="fluting-readings"><article><h3>Doric · IV.3.9</h3><p lang="la" class="source-words">${doricLatin}</p><p>“In the middle of the square let the compass’s centre be placed, and let a curved line be drawn which touches the square’s corners.”</p><p>The circle passes through all four corners. Its centre lies half a groove width above the mouth of the cut; the hollow uses a quarter of that circle. Vitruvius also permits twenty flat faces in this paragraph.</p><details><summary>Read the Latin construction</summary><p><i lang="la">in medio quadrato</i>: “in the middle of the square,” with the ablative after <i>in</i>. <i lang="la">circini</i> is genitive: “of the compass.” <i lang="la">centrum</i> is the subject of the passive command <i lang="la">conlocetur</i>, “let it be placed.”</p><p><i lang="la">agatur</i>: “let [a line] be drawn.” <i lang="la">quae</i> refers back to <i lang="la">linea</i>; <i lang="la">angulos</i> is what that line touches. The quoted clause avoids the disputed bracketed word earlier in Krohn’s paragraph.</p></details><a href="#fluting-sources" data-source="0">Inspect the complete Latin page</a></article><article><h3>Ionic · III.5.14</h3><p lang="la" class="source-words">${ionicLatin}</p><p>“And the point of the square should be able to travel round the curve, keeping contact.”</p><p>The preceding words place the tool against the groove’s corners. With a 90° square, simultaneous contact with both edges is consistent with a semicircular hollow. This paragraph specifies twenty-four flutes.</p><details><summary>Read the Latin and its editorial supply</summary><p><i lang="la">normae</i> means “of the square,” a carpenter’s right-angle tool. <i lang="la">cacumen</i> is its point; <i lang="la">pervagari possit</i> means “should be able to move about.” <i lang="la">tangendo</i> expresses the action of keeping contact.</p><p>Krohn prints <i lang="la">anconibus 〈angulos〉 striarum dextra ac sinistra tangat</i>: “[it] should touch the groove’s corners on the right and left with its arms.” The brackets mark <i lang="la">angulos</i> as an editorial supplement; the apparatus credits Jocundus. Inspect the apparatus beneath the text.</p></details><a href="#fluting-sources" data-source="1">Inspect the Latin and brackets</a></article></div></section>
<section class="fluting-section" id="greek-fluting"><p class="eyebrow">A Greek word in its own context</p><h2>The fluting of a column.</h2><p lang="grc" class="source-words greek-clause">${greekFluting}</p><p>“For the assembling of stones is different from the fluting of a column.”</p><p>Aristotle, <cite>Nicomachean Ethics</cite> X.4, 1174a23–24. He contrasts different activities within building. This is evidence for the word and its use, not an instruction for carving a profile.</p><div class="genitive-line"><span lang="grc">τῆς <span>(τοῦ κίονος)</span> ῥαβδώσεως</span><span>of the fluting <strong>of the column</strong></span></div><div class="fluting-grammar"><article><h3 lang="grc">κίων → κίονος</h3><p>“Column,” then “of a column.” The genitive <i lang="grc">τοῦ κίονος</i> sits inside the larger noun phrase. Its article is masculine.</p></article><article><h3 lang="grc">ῥάβδωσις → ῥαβδώσεως</h3><p>“Fluting,” then “of fluting.” The feminine article <i lang="grc">τῆς</i> belongs to this outer noun, not to <i lang="grc">κίονος</i>. <a href="https://atlas.perseus.tufts.edu/dictionaries/entry/urn%3Acite2%3Ascaife-viewer%3Adictionaries.v1%3Alsj-n92050/">Read the LSJ entry</a>.</p></article><article><h3 lang="grc">ἑτέρα τῆς…</h3><p>“Different from…” takes the genitive here. <i lang="grc">σύνθεσις</i>, “assembling,” is the subject; <i lang="grc">τῶν λίθων</i> tells us what is assembled: stones.</p></article></div><a href="#fluting-sources" data-source="2">Find the Greek clause on the printed page</a></section>`;
}
