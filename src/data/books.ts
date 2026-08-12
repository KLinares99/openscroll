/**
 * Per-book context used by the Deep Study panel.
 *
 * Attributions follow mainstream scholarly consensus and note where authorship
 * or dating is genuinely disputed, rather than asserting one tradition as fact.
 */
export interface BookContext {
  author: string
  when: string
  genre: string
  audience: string
  theme: string
  summary: string
}

export const BOOK_CONTEXT: BookContext[] = [
  { author: 'Traditionally Moses; composite sources widely proposed', when: 'Reached final form c. 6th–5th c. BC', genre: 'Narrative / primeval history', audience: 'Israel', theme: 'Beginnings, covenant, promise', summary: 'Creation, fall, flood and the calling of Abraham’s family, tracing how one household becomes the vehicle of blessing for all nations.' },
  { author: 'Traditionally Moses', when: 'Events c. 15th–13th c. BC', genre: 'Narrative / law', audience: 'Israel', theme: 'Redemption and covenant', summary: 'God delivers Israel from slavery in Egypt, gives the Law at Sinai, and takes up residence among his people in the tabernacle.' },
  { author: 'Traditionally Moses', when: 'Sinai period', genre: 'Law / priestly manual', audience: 'Israel and its priests', theme: 'Holiness', summary: 'Sacrifice, purity and festival law defining how a holy God can dwell with an unholy people.' },
  { author: 'Traditionally Moses', when: 'Wilderness period', genre: 'Narrative / law', audience: 'Israel', theme: 'Testing in the wilderness', summary: 'Two censuses frame a generation that fails to trust God at the border of the land, and the generation that follows.' },
  { author: 'Traditionally Moses', when: 'Plains of Moab', genre: 'Covenant renewal speeches', audience: 'Israel before entering Canaan', theme: 'Covenant loyalty', summary: 'Moses’ farewell addresses restate the Law for a new generation and set blessing and curse before them.' },
  { author: 'Anonymous; associated with Joshua', when: 'Conquest era', genre: 'Narrative', audience: 'Israel', theme: 'Inheritance of the land', summary: 'Israel enters Canaan, and the land is apportioned among the tribes.' },
  { author: 'Anonymous', when: 'Pre-monarchic period', genre: 'Narrative', audience: 'Israel', theme: 'Cycles of apostasy and rescue', summary: 'A repeating spiral of unfaithfulness, oppression, cry and deliverance under a series of flawed judges.' },
  { author: 'Anonymous', when: 'Set in the era of the judges', genre: 'Novella', audience: 'Israel', theme: 'Loyal love and providence', summary: 'A Moabite widow’s faithfulness places her in the ancestral line of David.' },
  { author: 'Anonymous', when: 'Transition to monarchy', genre: 'Narrative', audience: 'Israel', theme: 'The rise of kingship', summary: 'Samuel, Saul and David — how Israel gets a king, and what kind of king God chooses.' },
  { author: 'Anonymous', when: 'David’s reign', genre: 'Narrative', audience: 'Israel', theme: 'Covenant with David', summary: 'David’s kingship, his covenant, his grievous failure and its long consequences.' },
  { author: 'Anonymous compiler', when: 'Exilic period', genre: 'Narrative', audience: 'Exiled Judah', theme: 'Kingship and the temple', summary: 'Solomon’s temple, the divided kingdom, and the prophetic confrontation of Elijah and Elisha.' },
  { author: 'Anonymous compiler', when: 'Exilic period', genre: 'Narrative', audience: 'Exiled Judah', theme: 'Judgment and exile', summary: 'The northern and southern kingdoms decline into idolatry and fall to Assyria and Babylon.' },
  { author: 'Traditionally the Chronicler (Ezra)', when: 'Post-exilic', genre: 'Selective history', audience: 'Returned exiles', theme: 'Worship and continuity', summary: 'Genealogies and David’s reign retold with the temple and its worship at the centre.' },
  { author: 'Traditionally the Chronicler', when: 'Post-exilic', genre: 'Selective history', audience: 'Returned exiles', theme: 'Temple and reform', summary: 'Solomon and the kings of Judah, measured by their faithfulness to true worship.' },
  { author: 'Traditionally Ezra', when: 'c. 5th c. BC', genre: 'Narrative / memoir', audience: 'Returned exiles', theme: 'Restoration', summary: 'The return from Babylon, the rebuilding of the temple and the renewal of the Law.' },
  { author: 'Nehemiah, with editorial framing', when: 'c. 5th c. BC', genre: 'Memoir', audience: 'Returned exiles', theme: 'Rebuilding', summary: 'Jerusalem’s walls are rebuilt against opposition, and the community recommits to the covenant.' },
  { author: 'Anonymous', when: 'Persian period', genre: 'Narrative', audience: 'Diaspora Jews', theme: 'Hidden providence', summary: 'A Jewish queen risks her life to avert genocide — in a book that never names God.' },
  { author: 'Anonymous', when: 'Uncertain; possibly very early', genre: 'Wisdom / poetic dialogue', audience: 'General', theme: 'Innocent suffering', summary: 'A righteous man loses everything, and the tidy theology of his friends collapses under the weight of it.' },
  { author: 'David and others', when: 'Compiled over centuries', genre: 'Hymnbook / poetry', audience: 'Worshipping Israel', theme: 'The whole range of prayer', summary: 'Praise, lament, thanksgiving and protest — the full emotional vocabulary of faith.' },
  { author: 'Solomon and other sages', when: 'Monarchic and later', genre: 'Wisdom sayings', audience: 'The young and teachable', theme: 'Skill in living', summary: 'Practical wisdom for speech, work, money, friendship and desire, rooted in the fear of the LORD.' },
  { author: '“The Preacher” (Qoheleth); traditionally Solomon', when: 'Uncertain', genre: 'Wisdom / philosophical reflection', audience: 'General', theme: 'Meaning under the sun', summary: 'An unflinching look at life’s brevity and apparent futility, ending in trust rather than despair.' },
  { author: 'Solomon or attributed to him', when: 'Uncertain', genre: 'Love poetry', audience: 'General', theme: 'Love and desire', summary: 'A frank celebration of romantic love, long read also as a picture of divine love.' },
  { author: 'Isaiah of Jerusalem; later chapters widely attributed to later hands', when: '8th c. BC onward', genre: 'Prophecy', audience: 'Judah', theme: 'Holiness, judgment, comfort', summary: 'Judgment on a faithless nation gives way to the promise of a servant who suffers for others.' },
  { author: 'Jeremiah, with Baruch as scribe', when: 'Late 7th–early 6th c. BC', genre: 'Prophecy', audience: 'Judah before and during exile', theme: 'Judgment and new covenant', summary: 'A prophet ignored by his own people announces exile — and a covenant written on the heart.' },
  { author: 'Traditionally Jeremiah', when: 'After 586 BC', genre: 'Funeral dirge', audience: 'Survivors of Jerusalem', theme: 'Grief and hope', summary: 'Five acrostic poems mourning the fall of Jerusalem, with mercy “new every morning” at the centre.' },
  { author: 'Ezekiel', when: '6th c. BC, in exile', genre: 'Prophecy / apocalyptic vision', audience: 'Exiles in Babylon', theme: 'Glory departed and restored', summary: 'Startling visions of God’s glory leaving the temple, dry bones raised, and a restored city.' },
  { author: 'Daniel; final form debated', when: '6th c. BC setting', genre: 'Court narrative and apocalyptic', audience: 'Jews under foreign rule', theme: 'Sovereignty over empires', summary: 'Faithfulness under pressure, and visions of kingdoms that rise and fall before an everlasting kingdom.' },
  { author: 'Hosea', when: '8th c. BC', genre: 'Prophecy', audience: 'Northern Israel', theme: 'Unfaithfulness and relentless love', summary: 'A prophet’s painful marriage becomes a living parable of God’s covenant love for an unfaithful people.' },
  { author: 'Joel', when: 'Uncertain', genre: 'Prophecy', audience: 'Judah', theme: 'The Day of the LORD', summary: 'A locust plague becomes a summons to repentance and a promise of the Spirit poured out on all flesh.' },
  { author: 'Amos', when: '8th c. BC', genre: 'Prophecy', audience: 'Northern Israel', theme: 'Justice', summary: 'A shepherd from Judah indicts a prosperous nation for trampling the poor while keeping up its religion.' },
  { author: 'Obadiah', when: 'After 586 BC', genre: 'Prophecy', audience: 'Edom and Judah', theme: 'Pride and reckoning', summary: 'The shortest book in the Old Testament: judgment on Edom for gloating over Jerusalem’s fall.' },
  { author: 'Anonymous', when: 'Set in the 8th c. BC', genre: 'Prophetic narrative', audience: 'Israel', theme: 'Mercy beyond borders', summary: 'A reluctant prophet discovers that God’s compassion extends to the enemy city he hoped would burn.' },
  { author: 'Micah', when: '8th c. BC', genre: 'Prophecy', audience: 'Judah and Israel', theme: 'Justice and mercy', summary: 'Judgment on exploitation, and the enduring summary: do justice, love mercy, walk humbly.' },
  { author: 'Nahum', when: '7th c. BC', genre: 'Prophecy', audience: 'Judah', theme: 'The fall of Nineveh', summary: 'The empire that terrorised the region is itself brought down.' },
  { author: 'Habakkuk', when: 'Late 7th c. BC', genre: 'Prophetic dialogue', audience: 'Judah', theme: 'Faith amid injustice', summary: 'A prophet argues with God about evil and ends by choosing to rejoice regardless.' },
  { author: 'Zephaniah', when: '7th c. BC', genre: 'Prophecy', audience: 'Judah', theme: 'The Day of the LORD', summary: 'Sweeping judgment narrows to a purified remnant God rejoices over with singing.' },
  { author: 'Haggai', when: '520 BC', genre: 'Prophecy', audience: 'Returned exiles', theme: 'Priorities', summary: 'A call to stop panelling private houses and finish the house of God.' },
  { author: 'Zechariah', when: 'c. 520 BC onward', genre: 'Prophecy / apocalyptic', audience: 'Returned exiles', theme: 'Restoration and the coming king', summary: 'Night visions and oracles pointing to a humble king entering Jerusalem.' },
  { author: 'Malachi', when: '5th c. BC', genre: 'Prophetic disputation', audience: 'Post-exilic Judah', theme: 'Covenant faithfulness', summary: 'God cross-examines a jaded people about worship, marriage and money, then promises a messenger.' },
  { author: 'Traditionally Matthew', when: 'c. AD 60–90', genre: 'Gospel', audience: 'Jewish Christians', theme: 'Jesus as promised Messiah', summary: 'Structured around five teaching blocks, presenting Jesus as the fulfilment of Israel’s scriptures.' },
  { author: 'Traditionally Mark', when: 'c. AD 60–70', genre: 'Gospel', audience: 'Roman Christians', theme: 'Jesus the suffering servant', summary: 'The shortest, fastest gospel, driving toward the cross and a centurion’s confession.' },
  { author: 'Luke', when: 'c. AD 60–85', genre: 'Gospel / orderly account', audience: 'Theophilus and Gentile readers', theme: 'Salvation for outsiders', summary: 'A physician’s carefully researched account, attentive to the poor, women and the excluded.' },
  { author: 'Traditionally John', when: 'c. AD 85–95', genre: 'Gospel', audience: 'The wider church', theme: 'Believing and life', summary: 'Seven signs and seven “I am” sayings written so readers may believe and have life.' },
  { author: 'Luke', when: 'c. AD 62–85', genre: 'Historical narrative', audience: 'Theophilus', theme: 'The Spirit and the mission', summary: 'The gospel moves from Jerusalem to Rome as the Spirit propels an unlikely movement outward.' },
  { author: 'Paul', when: 'c. AD 57', genre: 'Epistle', audience: 'The church at Rome', theme: 'The righteousness of God', summary: 'Paul’s most systematic letter: sin, justification, the Spirit, Israel, and a transformed life.' },
  { author: 'Paul', when: 'c. AD 54', genre: 'Epistle', audience: 'Corinth', theme: 'Unity and the cross', summary: 'Pastoral triage for a gifted, divided church — including the great chapters on love and resurrection.' },
  { author: 'Paul', when: 'c. AD 55', genre: 'Epistle', audience: 'Corinth', theme: 'Strength in weakness', summary: 'Paul defends his ministry and reframes suffering as the place God’s power is displayed.' },
  { author: 'Paul', when: 'c. AD 48–55', genre: 'Epistle', audience: 'Churches in Galatia', theme: 'Freedom in Christ', summary: 'A fierce argument that gentiles are justified by faith, not by law-keeping.' },
  { author: 'Paul, or a close associate', when: 'c. AD 60–90', genre: 'Epistle', audience: 'Ephesus and nearby churches', theme: 'The church as one body', summary: 'God’s eternal plan to unite all things in Christ, worked out in ordinary relationships.' },
  { author: 'Paul', when: 'c. AD 60–62', genre: 'Epistle', audience: 'Philippi', theme: 'Joy and humility', summary: 'A thank-you letter from prison containing the great hymn of Christ’s self-emptying.' },
  { author: 'Paul, or a close associate', when: 'c. AD 60–62', genre: 'Epistle', audience: 'Colossae', theme: 'The supremacy of Christ', summary: 'Against speculative add-ons, Paul insists Christ is sufficient and complete.' },
  { author: 'Paul', when: 'c. AD 50–51', genre: 'Epistle', audience: 'Thessalonica', theme: 'Hope and Christ’s return', summary: 'Encouragement to a young persecuted church, with teaching on those who have died.' },
  { author: 'Paul, or a close associate', when: 'c. AD 51', genre: 'Epistle', audience: 'Thessalonica', theme: 'Steadfastness', summary: 'Corrects panic about the day of the Lord and calls for steady, ordinary work.' },
  { author: 'Paul, or a later disciple', when: 'c. AD 62–100', genre: 'Pastoral epistle', audience: 'Timothy', theme: 'Sound teaching and order', summary: 'Instructions for leading a church: qualifications, worship and guarding the message.' },
  { author: 'Paul, or a later disciple', when: 'c. AD 64–100', genre: 'Pastoral epistle', audience: 'Timothy', theme: 'Endurance', summary: 'A final charge to keep preaching, written with the end in view.' },
  { author: 'Paul, or a later disciple', when: 'c. AD 62–100', genre: 'Pastoral epistle', audience: 'Titus', theme: 'Doctrine that shapes behaviour', summary: 'Ordering churches in Crete so that grace visibly reshapes daily conduct.' },
  { author: 'Paul', when: 'c. AD 60–62', genre: 'Personal letter', audience: 'Philemon', theme: 'Reconciliation', summary: 'A tactful appeal to receive a runaway slave back as a brother.' },
  { author: 'Unknown', when: 'Before AD 70', genre: 'Sermon / homily', audience: 'Jewish Christians under pressure', theme: 'Christ is better', summary: 'A sustained argument that Christ surpasses angels, Moses and the sacrificial system — so do not drift.' },
  { author: 'James, brother of Jesus', when: 'c. AD 45–62', genre: 'Wisdom epistle', audience: 'Scattered Jewish Christians', theme: 'Faith that acts', summary: 'Blunt, practical teaching on speech, wealth, favouritism and endurance.' },
  { author: 'Peter, with Silvanus', when: 'c. AD 62–64', genre: 'Epistle', audience: 'Persecuted churches in Asia Minor', theme: 'Suffering and hope', summary: 'How to live as exiles: honourably, hopefully, and without repaying evil.' },
  { author: 'Peter, or a later disciple', when: 'c. AD 65–110', genre: 'Epistle', audience: 'The wider church', theme: 'Guarding the truth', summary: 'Warning against false teachers and scoffers who deny Christ’s return.' },
  { author: 'John the Elder', when: 'c. AD 85–95', genre: 'Epistle', audience: 'A network of churches', theme: 'Love, truth, assurance', summary: 'Tests of genuine faith written so readers may know they have eternal life.' },
  { author: 'John the Elder', when: 'c. AD 85–95', genre: 'Personal letter', audience: '“The elect lady”', theme: 'Truth and hospitality', summary: 'A brief warning not to extend hospitality to those spreading deception.' },
  { author: 'John the Elder', when: 'c. AD 85–95', genre: 'Personal letter', audience: 'Gaius', theme: 'Hospitality and pride', summary: 'Commends a generous host and rebukes a domineering leader.' },
  { author: 'Jude, brother of James', when: 'c. AD 65–90', genre: 'Epistle', audience: 'The wider church', theme: 'Contending for the faith', summary: 'An urgent call to resist corrupting teachers, closing with one of scripture’s great benedictions.' },
  { author: 'John of Patmos', when: 'c. AD 95', genre: 'Apocalypse / prophecy', audience: 'Seven churches in Asia', theme: 'The Lamb reigns', summary: 'Symbolic visions assuring persecuted churches that the slain Lamb, not the empire, holds history.' },
]
