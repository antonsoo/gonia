# Unequal tensions in the same rope

The hoist room now offers a selectable modern model for losses during steady
raising. The default remains ideal. This extends the [source-route lesson](hoist-model.md),
not the surviving ancient prescription. Vitruvius supplies no numerical efficiency.

## Follow forces before counting work

Let eta be the chosen tension-transfer fraction, 0.50 through 1.00. At each
turning wheel the tension on its tied-end side is eta times the tension on its
hauling side. The model assumes a constant ratio, massless inextensible rope,
no slip on the sheaves, parallel strands and quasi-static raising. It does not
model a particular bearing, rope material, ancient machine or starting friction.
The windlass remains ideal. A wheel with no relative rope movement is assigned
zero resisting torque and equal tensions; this is an additional model assumption,
not a determination of possible static friction at rest.

In the source three-wheel route, the supporting tensions, read from tied end
toward windlass, are `eta^3 T`, `eta^2 T`, `eta T`, where T is the hauling-end
tension. Add the actual upward pulls to balance the full hanging weight W.
The source five-wheel route has five such terms. Moving the tie to the fixed
support removes the first supporting portion and makes the first upper wheel
stationary. That wheel does not receive a tension decrement in this model.

| Route                              | Supports | Supporting tensions / hauling T | Relative travel at successive wheel axles / rise h |
| ---------------------------------- | -------- | ------------------------------- | -------------------------------------------------- |
| Single fixed wheel, modern control | 1        | eta                             | 1                                                  |
| Three wheels, source tie           | 3        | eta^3, eta^2, eta               | 1, 2, 3                                            |
| Three wheels, fixed tie            | 2        | eta^2, eta                      | 0, 1, 2                                            |
| Five wheels, source tie            | 5        | eta^5, eta^4, eta^3, eta^2, eta | 1, 2, 3, 4, 5                                      |
| Five wheels, fixed tie             | 4        | eta^4, eta^3, eta^2, eta        | 0, 1, 2, 3, 4                                      |

Thus `T = W / sum(eta^j, j=1..n)`. This geometric sum calculates force; the
individual wheel ledger separately computes dissipated work. Each supporting
straight portion still shortens by h, so rope take-up remains `n h`, regardless
of this chosen loss assumption. Drum turns and hand travel are unchanged.

At a wheel with relative rope travel d, loss is
`(T_hauling_side - T_tied_side) d`. The axle can itself move, so substituting
**total rope take-up** for every wheel's d would be wrong. In this route, the
relative travel increases by h at each successive support. The implementation
walks the drawn route to find it. Summing those local losses gives exactly
`input work - W h` in the mathematical model. Small binary rounding differences
are retained in CSV rather than hidden by recomputing loss as a subtraction.

The hand force is `T / arm_ratio`, hand travel is `arm_ratio * n h`, and the
whole-system efficiency for a positive lift is `W / (n T)`. At h = 0 all work
is zero. The diagram then displays the limiting proportions for a positive lift,
with an explicit note, rather than evaluating 0/0 or claiming work was expended.
It still displays the steady-raising tension assumed for a subsequent motion.

## Three wheels at a chosen ninety percent

At W = 600 N, h = 1 m, arm/drum = 2 and eta = 0.90:

| Quantity                            | Result                               |
| ----------------------------------- | ------------------------------------ |
| Supporting tensions, tied end first | 179.335793, 199.261993, 221.402214 N |
| Hauling-end tension                 | 246.002460 N                         |
| Hand force                          | 123.001230 N                         |
| Rope take-up; hand travel           | 3 m; 6 m                             |
| Work lifting the load               | 600 J                                |
| Wheel losses, source-route order    | 19.926199, 44.280443, 73.800738 J    |
| Input work                          | 738.007380 J                         |
| Whole-system efficiency             | 81.3%                                |

For the same task and the same chosen ratio at five source-route wheels, hand
force falls to 81.398094 N while input work rises to 813.980937 J. More wheels
can reduce effort while increasing total work in this particular loss model.
These numbers are model results, not ancient measurements or equipment ratings.
The independently checked [CSV](../examples/hoist-loss/measurements.csv) retains
all five routes and slider traces.

## Source boundary and modern background

The retained Krohn 1912 Latin, editorial additions, quoted Greek, seven excerpts,
twenty-eight word notes and five full pages are unchanged. I inspected printed
pp.227 and 232 again. The source's lower-block fastening and division of the
three/five wheels are visible on p.227; p.232 connects circular motion with the
straight raising of loads. Neither supplies eta, SI dimensions or this force-and-work algorithm.

[Petzl, How to calculate mechanical advantage](https://www.petzl.com/us/en/professional/tech-tips/basic-techniques/how-to-calculate-mechanical-advantage/MAESTRO-Pe06-RapportsMouflage_PRO_a771r000000Co9vAAC.html)
explains following tensions and adding the strands acting on the load, and
explicitly distinguishes its ideal pulley discussion from real losses. It does
not validate our ancient machine, the common chosen eta at all wheels, the
stationary-wheel convention or these particular numbers. No third-party
illustrations, manufacturer test data or instructional text are redistributed.

The source PDF was downloaded again on 2026-11-01. Its 16,915,191 bytes hash to
`b13a68789a8a1dc567b6f9b47eabe6a37a306329fbfc2c1a027a6c30a90d5139`.
Regenerating PDF page 245 (printed 227) using `pdftoppm -scale-to 2100 -jpeg
-jpegopt quality=88` produced the exact bundled SHA-256
`32e70bf472c586f9267bc934a8da0b1b8876d1e60e79f5fa35b233d7e785bd19`.

## Records and compatibility

New JSON uses `gonia-hoist-v2` with seven settings, adding the integer percentage
`efficiency`. Version-one JSON and full old six-setting links reopen at 100%.
A version-one tag cannot silently carry new loss settings. Unknown fields,
repeated decoded property names, malformed tags, non-string arrangement names,
invalid ranges and off-grid distances are rejected before replacing the trial.

CSV preserves its earlier columns and adds the chosen ratio, whole efficiency,
loss, every supporting tension and all per-wheel tensions, relative travel and
losses in rope order (semicolon-separated within their quoted cells). SVG
retains editable state metadata and per-support tension attributes. The
script-free HTML embeds the comparison, wheel ledger, work bar, complete scans,
fonts, source notices, editable JSON and CSV. It captures the click-time settings
before loading assets. Pending native JSON reads cannot overwrite a newer
experiment or a newer import. These checks do not make browser storage permanent.
