import JSZip from "jszip";
import katex from "katex";
import { markdownToMoodleHtml } from "./markdown-to-html";

const TS = () => Math.floor(Date.now() / 1000);

// ── Shared XML helpers ────────────────────────────────────────────────────────

function esc(s: string | number | null | undefined): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function moodleBackupXml(modulename: string, title: string): string {
  const ts = TS();
  const actdir = `${modulename}_1`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<moodle_backup>
  <information>
    <name>backup-moodle2-activity-${modulename}-1-${ts}</name>
    <moodle_version>2023042401.05</moodle_version>
    <moodle_release>4.2.1+ (Build: 20230707)</moodle_release>
    <backup_version>2023042400</backup_version>
    <backup_release>4.2</backup_release>
    <backup_date>${ts}</backup_date>
    <mnet_remoteusers>0</mnet_remoteusers>
    <include_files>0</include_files>
    <include_file_references_to_external_content>0</include_file_references_to_external_content>
    <original_wwwroot>http://localhost</original_wwwroot>
    <original_site_identifier_hash>sivil_import_export</original_site_identifier_hash>
    <original_course_id>1</original_course_id>
    <original_course_format>topics</original_course_format>
    <original_course_fullname>Sivil Export</original_course_fullname>
    <original_course_shortname>sivil</original_course_shortname>
    <original_course_startdate>0</original_course_startdate>
    <original_course_enddate>0</original_course_enddate>
    <original_course_contextid>1</original_course_contextid>
    <original_system_contextid>1</original_system_contextid>
    <details>
      <detail backup_id="sivil-${ts}">
        <type>activity</type>
        <format>moodle2</format>
        <interactive>1</interactive>
        <mode>10</mode>
        <execution>1</execution>
        <executiontime>0</executiontime>
      </detail>
    </details>
    <contents>
      <activities>
        <activity>
          <moduleid>1</moduleid>
          <sectionid>1</sectionid>
          <sectionnumber>1</sectionnumber>
          <modulename>${modulename}</modulename>
          <title>${esc(title)}</title>
          <directory>activities/${actdir}</directory>
        </activity>
      </activities>
      <sections>
        <section>
          <sectionid>1</sectionid>
          <title>$@NULL@$</title>
          <directory>sections/section_1</directory>
        </section>
      </sections>
      <course>
        <courseid>1</courseid>
        <title>Sivil Export</title>
        <directory>course</directory>
      </course>
    </contents>
    <settings>
      <setting><level>root</level><name>filename</name><value>backup-moodle2-activity-${modulename}-1-${ts}.mbz</value></setting>
      <setting><level>root</level><name>imscc11</name><value>0</value></setting>
      <setting><level>root</level><name>users</name><value>0</value></setting>
      <setting><level>root</level><name>anonymize</name><value>0</value></setting>
      <setting><level>root</level><name>role_assignments</name><value>0</value></setting>
      <setting><level>root</level><name>activities</name><value>1</value></setting>
      <setting><level>root</level><name>blocks</name><value>0</value></setting>
      <setting><level>root</level><name>files</name><value>0</value></setting>
      <setting><level>root</level><name>filters</name><value>1</value></setting>
      <setting><level>root</level><name>comments</name><value>0</value></setting>
      <setting><level>root</level><name>badges</name><value>0</value></setting>
      <setting><level>root</level><name>calendarevents</name><value>1</value></setting>
      <setting><level>root</level><name>userscompletion</name><value>0</value></setting>
      <setting><level>root</level><name>logs</name><value>0</value></setting>
      <setting><level>root</level><name>grade_histories</name><value>0</value></setting>
      <setting><level>root</level><name>questionbank</name><value>1</value></setting>
      <setting><level>root</level><name>groups</name><value>0</value></setting>
      <setting><level>root</level><name>competencies</name><value>1</value></setting>
      <setting><level>root</level><name>customfield</name><value>0</value></setting>
      <setting><level>root</level><name>contentbankcontent</name><value>0</value></setting>
      <setting><level>root</level><name>legacyfiles</name><value>0</value></setting>
      <setting>
        <level>activity</level>
        <activity>${actdir}</activity>
        <name>${actdir}_included</name>
        <value>1</value>
      </setting>
      <setting>
        <level>activity</level>
        <activity>${actdir}</activity>
        <name>${actdir}_userinfo</name>
        <value>0</value>
      </setting>
    </settings>
  </information>
</moodle_backup>`;
}

function moduleXml(modulename: string): string {
  const ts = TS();
  return `<?xml version="1.0" encoding="UTF-8"?>
<module id="1" version="2023042400">
  <modulename>${modulename}</modulename>
  <sectionid>1</sectionid>
  <sectionnumber>1</sectionnumber>
  <idnumber></idnumber>
  <added>${ts}</added>
  <score>0</score>
  <indent>0</indent>
  <visible>1</visible>
  <visibleoncoursepage>1</visibleoncoursepage>
  <visibleold>1</visibleold>
  <groupmode>0</groupmode>
  <groupingid>0</groupingid>
  <completion>0</completion>
  <completiongradeitemnumber>$@NULL@$</completiongradeitemnumber>
  <completionpassgrade>0</completionpassgrade>
  <completionview>0</completionview>
  <completionexpected>0</completionexpected>
  <availability>$@NULL@$</availability>
  <showdescription>0</showdescription>
  <downloadcontent>1</downloadcontent>
  <tags></tags>
</module>`;
}

// ── Static XML blobs ──────────────────────────────────────────────────────────

const emptyRoles           = `<?xml version="1.0" encoding="UTF-8"?><roles><role_overrides/><role_assignments/></roles>`;
const emptyCourseRoles     = `<?xml version="1.0" encoding="UTF-8"?><roles><role_overrides/><role_assignments/></roles>`;
const emptyRolesDefinition = `<?xml version="1.0" encoding="UTF-8"?><roles_definition></roles_definition>`;
const emptyGrades          = `<?xml version="1.0" encoding="UTF-8"?><activity_gradebook><grade_items/><grade_letters/></activity_gradebook>`;
const emptyGradeHistory    = `<?xml version="1.0" encoding="UTF-8"?><grade_history><grade_grades></grade_grades></grade_history>`;
const emptyComments        = `<?xml version="1.0" encoding="UTF-8"?><comments></comments>`;
const emptyCompetencies    = `<?xml version="1.0" encoding="UTF-8"?><module_competencies></module_competencies>`;
const emptyCalendar        = `<?xml version="1.0" encoding="UTF-8"?><events></events>`;
const emptyFilters         = `<?xml version="1.0" encoding="UTF-8"?><filters><filter_actives/><filter_configs/></filters>`;
const emptyInforef         = `<?xml version="1.0" encoding="UTF-8"?><inforef></inforef>`;
const emptyFiles           = `<?xml version="1.0" encoding="UTF-8"?><files></files>`;
const emptyUsers           = `<?xml version="1.0" encoding="UTF-8"?><users></users>`;
const emptyGroups          = `<?xml version="1.0" encoding="UTF-8"?><groups></groups>`;
const emptyQuestions       = `<?xml version="1.0" encoding="UTF-8"?><question_categories></question_categories>`;
const emptyScales          = `<?xml version="1.0" encoding="UTF-8"?><scales_definition></scales_definition>`;
const emptyOutcomes        = `<?xml version="1.0" encoding="UTF-8"?><outcomes_definition></outcomes_definition>`;
const emptyCourseCompetencies = `<?xml version="1.0" encoding="UTF-8"?><course_competencies><competencies></competencies><user_competencies></user_competencies></course_competencies>`;
const emptyCourseContentbank = `<?xml version="1.0" encoding="UTF-8"?><contents></contents>`;
const emptyCourseCompletionDefaults = `<?xml version="1.0" encoding="UTF-8"?><course_completion_defaults></course_completion_defaults>`;
const emptyCourseEnrolments = `<?xml version="1.0" encoding="UTF-8"?><enrolments><enrols></enrols></enrolments>`;

function gradebookXml(): string {
  const ts = TS();
  return `<?xml version="1.0" encoding="UTF-8"?>
<gradebook>
  <attributes>
  </attributes>
  <grade_categories>
    <grade_category id="1">
      <parent>$@NULL@$</parent>
      <depth>1</depth>
      <path>/1/</path>
      <fullname>?</fullname>
      <aggregation>10</aggregation>
      <keephigh>0</keephigh>
      <droplow>0</droplow>
      <aggregateonlygraded>1</aggregateonlygraded>
      <aggregateoutcomes>0</aggregateoutcomes>
      <timecreated>${ts}</timecreated>
      <timemodified>${ts}</timemodified>
      <hidden>0</hidden>
    </grade_category>
  </grade_categories>
  <grade_items>
    <grade_item id="1">
      <categoryid>$@NULL@$</categoryid>
      <itemname>$@NULL@$</itemname>
      <itemtype>course</itemtype>
      <itemmodule>$@NULL@$</itemmodule>
      <iteminstance>1</iteminstance>
      <itemnumber>$@NULL@$</itemnumber>
      <iteminfo>$@NULL@$</iteminfo>
      <idnumber>$@NULL@$</idnumber>
      <calculation>$@NULL@$</calculation>
      <gradetype>1</gradetype>
      <grademax>100.00000</grademax>
      <grademin>0.00000</grademin>
      <scaleid>$@NULL@$</scaleid>
      <outcomeid>$@NULL@$</outcomeid>
      <gradepass>0.00000</gradepass>
      <multfactor>1.00000</multfactor>
      <plusfactor>0.00000</plusfactor>
      <aggregationcoef>0.00000</aggregationcoef>
      <aggregationcoef2>0.00000</aggregationcoef2>
      <weightoverride>0</weightoverride>
      <sortorder>1</sortorder>
      <display>0</display>
      <decimals>$@NULL@$</decimals>
      <hidden>0</hidden>
      <locked>0</locked>
      <locktime>0</locktime>
      <needsupdate>0</needsupdate>
      <timecreated>${ts}</timecreated>
      <timemodified>${ts}</timemodified>
      <grade_grades>
      </grade_grades>
    </grade_item>
  </grade_items>
  <grade_letters>
  </grade_letters>
  <grade_settings>
    <grade_setting id="">
      <name>minmaxtouse</name>
      <value>1</value>
    </grade_setting>
  </grade_settings>
</gradebook>`;
}

const courseXml     = `<?xml version="1.0" encoding="UTF-8"?>
<course id="1" contextid="1">
  <shortname>sivil</shortname>
  <fullname>Sivil Export</fullname>
  <idnumber></idnumber>
  <summary></summary>
  <summaryformat>1</summaryformat>
  <format>topics</format>
  <showgrades>1</showgrades>
  <newsitems>5</newsitems>
  <startdate>0</startdate>
  <enddate>0</enddate>
  <marker>0</marker>
  <maxbytes>0</maxbytes>
  <legacyfiles>0</legacyfiles>
  <showreports>0</showreports>
  <visible>1</visible>
  <groupmode>0</groupmode>
  <groupmodeforce>0</groupmodeforce>
  <defaultgroupingid>0</defaultgroupingid>
  <lang></lang>
  <theme></theme>
  <timecreated>0</timecreated>
  <timemodified>0</timemodified>
  <requested>0</requested>
  <showactivitydates>0</showactivitydates>
  <showcompletionconditions>0</showcompletionconditions>
  <hiddensections>0</hiddensections>
  <coursedisplay>0</coursedisplay>
  <tags></tags>
  <customfields></customfields>
  <enrollments></enrollments>
</course>`;
const courseInforef = `<?xml version="1.0" encoding="UTF-8"?><inforef></inforef>`;
const sectionXml    = `<?xml version="1.0" encoding="UTF-8"?>
<section id="1">
  <number>1</number>
  <name>$@NULL@$</name>
  <summary></summary>
  <summaryformat>1</summaryformat>
  <sequence>1</sequence>
  <visible>1</visible>
  <availability>$@NULL@$</availability>
  <timemodified>0</timemodified>
</section>`;

// ── Helpers to add all required files to a zip ────────────────────────────────

function addRootFiles(zip: JSZip, questionsContent?: string): void {
  zip.file("files.xml", emptyFiles);
  zip.file("users.xml", emptyUsers);
  zip.file("roles.xml", emptyRolesDefinition);
  zip.file("groups.xml", emptyGroups);
  zip.file("scales.xml", emptyScales);
  zip.file("outcomes.xml", emptyOutcomes);
  zip.file("gradebook.xml", gradebookXml());
  zip.file("grade_history.xml", emptyGradeHistory);
  // Allow caller to supply questions.xml (quiz) or use empty (page/rps)
  zip.file("questions.xml", questionsContent ?? emptyQuestions);
}

function addCourseFiles(zip: JSZip): void {
  zip.file("course/course.xml", courseXml);
  zip.file("course/inforef.xml", courseInforef);
  zip.file("course/roles.xml", emptyCourseRoles);
  zip.file("course/completiondefaults.xml", emptyCourseCompletionDefaults);
  zip.file("course/calendar.xml", emptyCalendar);
  zip.file("course/competencies.xml", emptyCourseCompetencies);
  zip.file("course/contentbank.xml", emptyCourseContentbank);
  zip.file("course/enrolments.xml", emptyCourseEnrolments);
  zip.file("course/filters.xml", emptyFilters);
}

function addSectionFiles(zip: JSZip): void {
  zip.file("sections/section_1/section.xml", sectionXml);
  zip.file("sections/section_1/inforef.xml", emptyInforef);
}

function addActivityCommonFiles(
  zip: JSZip, actdir: string, skipGrades = false, skipInforef = false
): void {
  zip.file(`activities/${actdir}/module.xml`, moduleXml(actdir.replace(/_\d+$/, "")));
  zip.file(`activities/${actdir}/roles.xml`, emptyRoles);
  if (!skipGrades) zip.file(`activities/${actdir}/grades.xml`, emptyGrades);
  zip.file(`activities/${actdir}/grade_history.xml`, emptyGradeHistory);
  zip.file(`activities/${actdir}/comments.xml`, emptyComments);
  zip.file(`activities/${actdir}/competencies.xml`, emptyCompetencies);
  zip.file(`activities/${actdir}/calendar.xml`, emptyCalendar);
  zip.file(`activities/${actdir}/filters.xml`, emptyFilters);
  if (!skipInforef) zip.file(`activities/${actdir}/inforef.xml`, emptyInforef);
}

// ── Page (Material / RPS) ─────────────────────────────────────────────────────

function pageActivityXml(title: string, content: string, summary: string): string {
  const ts = TS();
  return `<?xml version="1.0" encoding="UTF-8"?>
<activity id="1" moduleid="1" modulename="page" contextid="2">
  <page id="1">
    <name>${esc(title)}</name>
    <intro>${esc(summary)}</intro>
    <introformat>1</introformat>
    <content>${esc(content)}</content>
    <contentformat>1</contentformat>
    <legacyfiles>0</legacyfiles>
    <legacyfileslast>$@NULL@$</legacyfileslast>
    <display>5</display>
    <displayoptions>a:2:{s:10:"printintro";i:0;s:17:"printlastmodified";i:1;}</displayoptions>
    <revision>1</revision>
    <timemodified>${ts}</timemodified>
  </page>
</activity>`;
}

interface MaterialAttachment {
  filename: string;
  url: string;
  fileType: string;
  fileSize: number;
  sectionHeading: string;
}

function attachmentsHtml(attachments: MaterialAttachment[], appBaseUrl: string): string {
  if (!attachments.length) return "";

  const icons: Record<string, string> = { pdf: "📄", pptx: "📊", ppt: "📊" };

  const rows = attachments.map(a => {
    const icon = icons[a.fileType] ?? "📎";
    const absoluteUrl = a.url.startsWith("http") ? a.url : `${appBaseUrl}${a.url}`;
    const sizeMb = (a.fileSize / 1024 / 1024).toFixed(1);
    return `<tr>
      <td style="padding:8px 12px;">${icon} <a href="${absoluteUrl}" target="_blank">${esc(a.filename)}</a></td>
      <td style="padding:8px 12px;color:#6b7280;">${a.fileType.toUpperCase()}</td>
      <td style="padding:8px 12px;color:#6b7280;">${sizeMb} MB</td>
    </tr>`;
  }).join("\n");

  return `<hr style="margin:2em 0;border:none;border-top:1px solid #e5e7eb;" />
<h3 style="color:#1d4ed8;">📎 File Lampiran</h3>
<table border="1" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;">
  <thead>
    <tr style="background:#f1f5f9;">
      <th style="padding:8px 12px;text-align:left;">File</th>
      <th style="padding:8px 12px;text-align:left;">Format</th>
      <th style="padding:8px 12px;text-align:left;">Ukuran</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
}

export async function generateMaterialMbz(
  material: { title: string; content: string; summary?: string | null },
  opts?: { appBaseUrl?: string; attachments?: MaterialAttachment[] }
): Promise<Buffer> {
  const { appBaseUrl, attachments = [] } = opts ?? {};
  let html = await markdownToMoodleHtml(material.content, appBaseUrl);
  if (attachments.length && appBaseUrl) {
    html += attachmentsHtml(attachments, appBaseUrl);
  }
  const zip = new JSZip();

  zip.file("moodle_backup.xml", moodleBackupXml("page", material.title));
  addCourseFiles(zip);
  addSectionFiles(zip);
  zip.file("activities/page_1/page.xml", pageActivityXml(material.title, html, material.summary ?? ""));
  addActivityCommonFiles(zip, "page_1");
  addRootFiles(zip);

  return zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
}

export interface RpsData {
  title: string;
  courseName: string;
  courseCode?: string | null;
  credits: number;
  semester: number;
  semesterType: string;
  academicYear: string;
  prerequisite?: string | null;
  program: string;
  description?: string | null;
  cpl?: string | null;
  cpmk?: string | null;
  assessmentScheme?: string | null;
  references?: string | null;
  weeks?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
}

export async function generateRpsMbz(rps: RpsData, opts?: { appBaseUrl?: string }): Promise<Buffer> {
  const html = renderRpsHtml(rps, opts?.appBaseUrl);
  const zip = new JSZip();

  zip.file("moodle_backup.xml", moodleBackupXml("page", rps.title));
  addCourseFiles(zip);
  addSectionFiles(zip);
  zip.file("activities/page_1/page.xml", pageActivityXml(rps.title, html, "Rencana Pembelajaran Semester — " + rps.courseName));
  addActivityCommonFiles(zip, "page_1");
  addRootFiles(zip);

  return zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

function quizActivityXml(title: string, qlist: QuizQuestion[]): string {
  const ts = TS();
  const sumgrades = qlist.reduce((s, q) => s + (q.points ?? 1), 0);
  // Each question_bank_entry starts at id 1; quizid=1, contextid=2
  const instances = qlist.map((q, i) => {
    const entryId = i + 1;
    return `      <question_instance id="${entryId}">
        <quizid>1</quizid>
        <slot>${i + 1}</slot>
        <page>${i + 1}</page>
        <displaynumber>$@NULL@$</displaynumber>
        <requireprevious>0</requireprevious>
        <maxmark>${(q.points ?? 1).toFixed(7)}</maxmark>
        <question_reference id="${entryId}">
          <usingcontextid>2</usingcontextid>
          <component>mod_quiz</component>
          <questionarea>slot</questionarea>
          <questionbankentryid>${entryId}</questionbankentryid>
          <version>$@NULL@$</version>
        </question_reference>
      </question_instance>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<activity id="1" moduleid="1" modulename="quiz" contextid="2">
  <quiz id="1">
    <name>${esc(title)}</name>
    <intro></intro>
    <introformat>1</introformat>
    <timeopen>0</timeopen>
    <timeclose>0</timeclose>
    <timelimit>0</timelimit>
    <overduehandling>autosubmit</overduehandling>
    <graceperiod>0</graceperiod>
    <preferredbehaviour>deferredfeedback</preferredbehaviour>
    <canredoquestions>0</canredoquestions>
    <attempts_number>0</attempts_number>
    <attemptonlast>0</attemptonlast>
    <grademethod>1</grademethod>
    <decimalpoints>2</decimalpoints>
    <questiondecimalpoints>-1</questiondecimalpoints>
    <reviewattempt>69888</reviewattempt>
    <reviewcorrectness>4352</reviewcorrectness>
    <reviewmarks>4352</reviewmarks>
    <reviewspecificfeedback>4352</reviewspecificfeedback>
    <reviewgeneralfeedback>4352</reviewgeneralfeedback>
    <reviewrightanswer>4352</reviewrightanswer>
    <reviewoverallfeedback>4352</reviewoverallfeedback>
    <questionsperpage>1</questionsperpage>
    <navmethod>free</navmethod>
    <shuffleanswers>1</shuffleanswers>
    <sumgrades>${sumgrades.toFixed(5)}</sumgrades>
    <grade>100.00000</grade>
    <timecreated>${ts}</timecreated>
    <timemodified>${ts}</timemodified>
    <password></password>
    <subnet></subnet>
    <browsersecurity>-</browsersecurity>
    <delay1>0</delay1>
    <delay2>0</delay2>
    <showuserpicture>0</showuserpicture>
    <showblocks>0</showblocks>
    <completionattemptsexhausted>0</completionattemptsexhausted>
    <completionminattempts>0</completionminattempts>
    <allowofflineattempts>0</allowofflineattempts>
    <subplugin_quizaccess_seb_quiz>
    </subplugin_quizaccess_seb_quiz>
    <question_instances>
${instances}
    </question_instances>
    <sections>
      <section id="1">
        <firstslot>1</firstslot>
        <heading>Soal Quiz</heading>
        <shufflequestions>0</shufflequestions>
      </section>
    </sections>
    <feedbacks>
      <feedback id="1">
        <feedbacktext></feedbacktext>
        <feedbacktextformat>1</feedbacktextformat>
        <mingrade>0.00000</mingrade>
        <maxgrade>101.00000</maxgrade>
      </feedback>
    </feedbacks>
    <overrides>
    </overrides>
    <grades>
    </grades>
    <attempts>
    </attempts>
  </quiz>
</activity>`;
}

function quizGradesXml(title: string): string {
  const ts = TS();
  return `<?xml version="1.0" encoding="UTF-8"?>
<activity_gradebook>
  <grade_items>
    <grade_item id="1">
      <categoryid>1</categoryid>
      <itemname>${esc(title)}</itemname>
      <itemtype>mod</itemtype>
      <itemmodule>quiz</itemmodule>
      <iteminstance>1</iteminstance>
      <itemnumber>0</itemnumber>
      <iteminfo>$@NULL@$</iteminfo>
      <idnumber></idnumber>
      <calculation>$@NULL@$</calculation>
      <gradetype>1</gradetype>
      <grademax>100.00000</grademax>
      <grademin>0.00000</grademin>
      <scaleid>$@NULL@$</scaleid>
      <outcomeid>$@NULL@$</outcomeid>
      <gradepass>0.00000</gradepass>
      <multfactor>1.00000</multfactor>
      <plusfactor>0.00000</plusfactor>
      <aggregationcoef>1.00000</aggregationcoef>
      <aggregationcoef2>0.00000</aggregationcoef2>
      <weightoverride>0</weightoverride>
      <sortorder>2</sortorder>
      <display>0</display>
      <decimals>$@NULL@$</decimals>
      <hidden>0</hidden>
      <locked>0</locked>
      <locktime>0</locktime>
      <needsupdate>0</needsupdate>
      <timecreated>${ts}</timecreated>
      <timemodified>${ts}</timemodified>
      <grade_grades>
      </grade_grades>
    </grade_item>
  </grade_items>
  <grade_letters>
  </grade_letters>
</activity_gradebook>`;
}

// questions.xml uses Moodle 4.x question bank format:
// top category (contextlevel=70, parent=0) + real category with question_bank_entries
function questionsXml(title: string, questions: QuizQuestion[]): string {
  const ts = Date.now();
  const topCatId = 1;
  const realCatId = 2;

  const bankEntries = questions.map((q, i) => {
    const entryId = i + 1;
    return `      <question_bank_entry id="${entryId}">
        <questioncategoryid>${realCatId}</questioncategoryid>
        <idnumber>$@NULL@$</idnumber>
        <ownerid>$@NULL@$</ownerid>
        <question_version>
          <question_versions id="${entryId}">
            <version>1</version>
            <status>ready</status>
            <questions>
${buildQuestionXml(q, entryId)}
            </questions>
          </question_versions>
        </question_version>
      </question_bank_entry>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<question_categories>
  <question_category id="${topCatId}">
    <name>top</name>
    <contextid>2</contextid>
    <contextlevel>70</contextlevel>
    <contextinstanceid>1</contextinstanceid>
    <info></info>
    <infoformat>0</infoformat>
    <stamp>sivil-top-${ts}</stamp>
    <parent>0</parent>
    <sortorder>0</sortorder>
    <idnumber>$@NULL@$</idnumber>
    <question_bank_entries>
    </question_bank_entries>
  </question_category>
  <question_category id="${realCatId}">
    <name>${esc(title)} — Soal</name>
    <contextid>2</contextid>
    <contextlevel>70</contextlevel>
    <contextinstanceid>1</contextinstanceid>
    <info></info>
    <infoformat>0</infoformat>
    <stamp>sivil-cat-${ts}</stamp>
    <parent>${topCatId}</parent>
    <sortorder>999</sortorder>
    <idnumber>$@NULL@$</idnumber>
    <question_bank_entries>
${bankEntries}
    </question_bank_entries>
  </question_category>
</question_categories>`;
}

interface QuizQuestion {
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: number | boolean | string;
  explanation?: string;
  modelAnswer?: string;
  points?: number;
}

// Pre-render a single LaTeX expression to KaTeX HTML (output: 'html' — no MathML)
function katexRender(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex.trim(), { throwOnError: false, displayMode: display, output: "html" });
  } catch {
    return display ? `$$${latex}$$` : `$${latex}$`;
  }
}

// Convert $...$ and $$...$$ to pre-rendered KaTeX HTML.
// Campus Moodle stores math as KaTeX HTML so no MathJax filter is needed.
function mathToKatex(text: string): string {
  // Display math $$...$$ first
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => katexRender(inner, true));
  // Inline math $...$
  text = text.replace(/(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g, (_, inner) => katexRender(inner, false));
  return text;
}

// Wrap text in <p>, pre-render math, then XML-escape — produces &lt;p&gt;...&lt;/p&gt; as Moodle expects
function hp(text: string): string {
  return text.trim() ? esc(`<p>${mathToKatex(text.trim())}</p>`) : "";
}

function buildQuestionXml(q: QuizQuestion, id: number): string {
  const typeMap: Record<string, string> = {
    multiple_choice: "multichoice", pilihan_ganda: "multichoice",
    true_false: "truefalse", benar_salah: "truefalse",
    essay: "essay", uraian: "essay",
    short_answer: "shortanswer", isian_singkat: "shortanswer",
  };
  const mtype = typeMap[q.type?.toLowerCase() ?? "essay"] ?? "essay";
  const ts = TS();
  const points = q.points ?? 1;
  const penalty = mtype === "essay" ? "0.0000000" : mtype === "truefalse" ? "1.0000000" : "0.3333333";

  let qtypeXml = "";

  if (mtype === "multichoice") {
    const opts = q.options ?? [];
    const correctIdx = typeof q.correctAnswer === "number" ? q.correctAnswer : 0;
    const answersXml = opts.map((opt, i) => `              <answer id="${id * 100 + i}">
                <answertext>${hp(opt)}</answertext>
                <answerformat>1</answerformat>
                <fraction>${i === correctIdx ? "1.0000000" : "0.0000000"}</fraction>
                <feedback></feedback>
                <feedbackformat>1</feedbackformat>
              </answer>`).join("\n");
    qtypeXml = `              <plugin_qtype_multichoice_question>
                <answers>
${answersXml}
                </answers>
                <multichoice id="${id}">
                  <layout>0</layout>
                  <single>1</single>
                  <shuffleanswers>1</shuffleanswers>
                  <correctfeedback>&lt;p&gt;Jawaban Anda benar.&lt;/p&gt;</correctfeedback>
                  <correctfeedbackformat>1</correctfeedbackformat>
                  <partiallycorrectfeedback>&lt;p&gt;Jawaban anda separuh benar.&lt;/p&gt;</partiallycorrectfeedback>
                  <partiallycorrectfeedbackformat>1</partiallycorrectfeedbackformat>
                  <incorrectfeedback>&lt;p&gt;Jawaban Anda salah.&lt;/p&gt;</incorrectfeedback>
                  <incorrectfeedbackformat>1</incorrectfeedbackformat>
                  <answernumbering>abc</answernumbering>
                  <shownumcorrect>1</shownumcorrect>
                  <showstandardinstruction>0</showstandardinstruction>
                </multichoice>
              </plugin_qtype_multichoice_question>`;
  } else if (mtype === "truefalse") {
    const correct = q.correctAnswer === true || q.correctAnswer === "true" || q.correctAnswer === 1;
    qtypeXml = `              <plugin_qtype_truefalse_question>
                <answers>
                  <answer id="${id * 100}">
                    <answertext>True</answertext>
                    <answerformat>0</answerformat>
                    <fraction>${correct ? "1.0000000" : "0.0000000"}</fraction>
                    <feedback>${hp(q.explanation ?? "")}</feedback>
                    <feedbackformat>1</feedbackformat>
                  </answer>
                  <answer id="${id * 100 + 1}">
                    <answertext>False</answertext>
                    <answerformat>0</answerformat>
                    <fraction>${correct ? "0.0000000" : "1.0000000"}</fraction>
                    <feedback></feedback>
                    <feedbackformat>1</feedbackformat>
                  </answer>
                </answers>
                <truefalse id="${id}">
                  <trueanswer>${id * 100}</trueanswer>
                  <falseanswer>${id * 100 + 1}</falseanswer>
                </truefalse>
              </plugin_qtype_truefalse_question>`;
  } else if (mtype === "shortanswer") {
    const ans = q.modelAnswer ?? q.correctAnswer ?? "";
    qtypeXml = `              <plugin_qtype_shortanswer_question>
                <answers>
                  <answer id="${id * 100}">
                    <answertext>${esc(String(ans))}</answertext>
                    <answerformat>0</answerformat>
                    <fraction>1.0000000</fraction>
                    <feedback>${hp(q.explanation ?? "")}</feedback>
                    <feedbackformat>1</feedbackformat>
                  </answer>
                </answers>
                <shortanswer id="${id}">
                  <usecase>0</usecase>
                </shortanswer>
              </plugin_qtype_shortanswer_question>`;
  } else {
    const graderInfo = q.modelAnswer ?? q.explanation ?? "";
    qtypeXml = `              <plugin_qtype_essay_question>
                <essay id="${id}">
                  <responseformat>editor</responseformat>
                  <responserequired>1</responserequired>
                  <responsefieldlines>10</responsefieldlines>
                  <minwordlimit>$@NULL@$</minwordlimit>
                  <maxwordlimit>$@NULL@$</maxwordlimit>
                  <attachments>0</attachments>
                  <attachmentsrequired>0</attachmentsrequired>
                  <graderinfo>${hp(graderInfo)}</graderinfo>
                  <graderinfoformat>1</graderinfoformat>
                  <responsetemplate></responsetemplate>
                  <responsetemplateformat>1</responsetemplateformat>
                  <filetypeslist></filetypeslist>
                  <maxbytes>0</maxbytes>
                </essay>
              </plugin_qtype_essay_question>`;
  }

  return `              <question id="${id}">
                <parent>0</parent>
                <name>${esc(q.question?.substring(0, 100) ?? "Soal " + id)}</name>
                <questiontext>${hp(q.question ?? "")}</questiontext>
                <questiontextformat>1</questiontextformat>
                <generalfeedback>${hp(q.explanation ?? "")}</generalfeedback>
                <generalfeedbackformat>1</generalfeedbackformat>
                <defaultmark>${points.toFixed(7)}</defaultmark>
                <penalty>${penalty}</penalty>
                <qtype>${mtype}</qtype>
                <length>1</length>
                <stamp>sivil-q${id}-${ts}</stamp>
                <timecreated>${ts}</timecreated>
                <timemodified>${ts}</timemodified>
                <createdby>$@NULL@$</createdby>
                <modifiedby>$@NULL@$</modifiedby>
${qtypeXml}
                <plugin_qbank_comment_question>
                  <comments>
                  </comments>
                </plugin_qbank_comment_question>
                <plugin_qbank_customfields_question>
                  <customfields>
                  </customfields>
                </plugin_qbank_customfields_question>
                <question_hints>
                </question_hints>
                <tags>
                </tags>
              </question>`;
}

// inforef.xml for quiz must declare grade_item and question_category IDs
// so Moodle's restore knows which categories to process from questions.xml
function quizInforefXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<inforef>
  <grade_itemref>
    <grade_item>
      <id>1</id>
    </grade_item>
  </grade_itemref>
  <question_categoryref>
    <question_category>
      <id>1</id>
    </question_category>
    <question_category>
      <id>2</id>
    </question_category>
  </question_categoryref>
</inforef>`;
}

export async function generateQuizMbz(quiz: {
  title: string;
  questions: string | QuizQuestion[];
}): Promise<Buffer> {
  const qlist: QuizQuestion[] = typeof quiz.questions === "string"
    ? JSON.parse(quiz.questions)
    : quiz.questions;

  const zip = new JSZip();
  zip.file("moodle_backup.xml", moodleBackupXml("quiz", quiz.title));
  addCourseFiles(zip);
  addSectionFiles(zip);
  zip.file("activities/quiz_1/quiz.xml", quizActivityXml(quiz.title, qlist));
  zip.file("activities/quiz_1/grades.xml", quizGradesXml(quiz.title));
  zip.file("activities/quiz_1/inforef.xml", quizInforefXml());
  addActivityCommonFiles(zip, "quiz_1", true, true);
  addRootFiles(zip, questionsXml(quiz.title, qlist));

  return zip.generateAsync({ type: "nodebuffer", compression: "STORE" });
}

// ── RPS HTML renderer ─────────────────────────────────────────────────────────

function renderRpsHtml(rps: RpsData, appBaseUrl?: string): string {
  const e = (v: string | number | null | undefined) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const sec = (title: string, content: string) =>
    `<h3 style="margin:24px 0 8px;font-size:16px;color:#1d4ed8;border-bottom:2px solid #dbeafe;padding-bottom:4px;">${title}</h3>${content}`;

  const tdH = `style="background:#1e3a8a;color:#fff;padding:8px 10px;font-weight:600;font-size:13px;text-align:left;"`;
  const td  = `style="padding:8px 10px;font-size:13px;border-bottom:1px solid #e2e8f0;vertical-align:top;"`;
  const tdAlt = `style="padding:8px 10px;font-size:13px;border-bottom:1px solid #e2e8f0;background:#f8fafc;vertical-align:top;"`;

  // ── parse JSON fields safely
  function parseJson<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }

  const cplList:   string[] = parseJson(rps.cpl, []);
  const cpmkList:  string[] = parseJson(rps.cpmk, []);
  const refList:   string[] = parseJson(rps.references, []);
  const weeks: Array<{
    weekNumber: number; topic: string; finalAbility: string; method: string;
    timeAllocation: number; learningExperience: string; criteria: string;
    weight: number; isExam: boolean; examType?: string;
  }> = parseJson(rps.weeks, []);
  const assessments: Array<{ component: string; weight: number; description: string }> =
    parseJson(rps.assessmentScheme, []);

  // ── Uploaded file section
  let fileSection = "";
  if (rps.fileUrl) {
    const absoluteUrl = rps.fileUrl.startsWith("http")
      ? rps.fileUrl
      : `${(appBaseUrl ?? "").replace(/\/$/, "")}${rps.fileUrl}`;
    const sizeMb = rps.fileSize ? (rps.fileSize / 1024 / 1024).toFixed(1) + " MB" : "";
    const typeLabel = (rps.fileType ?? "").toUpperCase();
    fileSection = sec("📎 File RPS",
      `<p style="margin:0 0 8px;font-size:14px;">File RPS lengkap tersedia untuk diunduh:</p>
<table border="0" cellpadding="0" cellspacing="0" style="border:1px solid #dbeafe;border-radius:8px;overflow:hidden;width:auto;">
<tr>
  <td style="padding:12px 16px;background:#eff6ff;">
    <a href="${absoluteUrl}" target="_blank" style="font-weight:600;color:#1d4ed8;text-decoration:none;font-size:15px;">
      📥 ${e(rps.fileName ?? "Download RPS")}
    </a>
    ${typeLabel || sizeMb ? `<span style="margin-left:12px;color:#6b7280;font-size:13px;">${typeLabel}${sizeMb ? " · " + sizeMb : ""}</span>` : ""}
  </td>
</tr>
</table>`
    );
  }

  // ── CPL section
  const cplSection = cplList.length ? sec("Capaian Pembelajaran Lulusan (CPL)",
    `<ol style="margin:0;padding-left:20px;">${cplList.map(c => `<li style="margin-bottom:4px;font-size:13px;">${e(c)}</li>`).join("")}</ol>`
  ) : "";

  // ── CPMK section
  const cpmkSection = cpmkList.length ? sec("Capaian Pembelajaran Mata Kuliah (CPMK)",
    `<ol style="margin:0;padding-left:20px;">${cpmkList.map(c => `<li style="margin-bottom:4px;font-size:13px;">${e(c)}</li>`).join("")}</ol>`
  ) : "";

  // ── Assessment scheme
  const assessmentSection = assessments.length ? sec("Skema Penilaian",
    `<table border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
<tr><th ${tdH}>Komponen</th><th ${tdH}>Bobot (%)</th><th ${tdH}>Keterangan</th></tr>
${assessments.map((a, i) => `<tr>
  <td ${i % 2 === 0 ? td : tdAlt}>${e(a.component)}</td>
  <td ${i % 2 === 0 ? td : tdAlt}>${a.weight}%</td>
  <td ${i % 2 === 0 ? td : tdAlt}>${e(a.description)}</td>
</tr>`).join("")}
<tr style="background:#f1f5f9;font-weight:600;"><td colspan="2" style="padding:8px 10px;font-size:13px;">Total</td><td style="padding:8px 10px;font-size:13px;">${assessments.reduce((s, a) => s + a.weight, 0)}%</td></tr>
</table>`
  ) : "";

  // ── Weekly plan
  const weeksSection = weeks.length ? sec("Rencana Pembelajaran Per Pertemuan",
    `<table border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;font-size:12px;">
<tr>
  <th ${tdH} style="width:4%;">Prt.</th>
  <th ${tdH} style="width:20%;">Bahan Kajian / Materi</th>
  <th ${tdH} style="width:20%;">Kemampuan Akhir (Sub-CPMK)</th>
  <th ${tdH} style="width:12%;">Metode</th>
  <th ${tdH} style="width:8%;">Waktu</th>
  <th ${tdH} style="width:20%;">Pengalaman Belajar</th>
  <th ${tdH} style="width:10%;">Kriteria Penilaian</th>
  <th ${tdH} style="width:6%;">Bobot</th>
</tr>
${weeks.map((w, i) => {
  const bg = w.isExam ? `style="background:#fef9c3;"` : (i % 2 === 0 ? `style="background:#fff;"` : `style="background:#f8fafc;"`);
  const examBadge = w.isExam ? ` <span style="background:#f59e0b;color:#fff;font-size:10px;padding:1px 4px;border-radius:3px;">${w.examType ?? "UJIAN"}</span>` : "";
  return `<tr ${bg}>
  <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;font-weight:600;">${w.weekNumber}${examBadge}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${e(w.topic)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${e(w.finalAbility)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${e(w.method)}</td>
  <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;">${w.timeAllocation} mnt</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${e(w.learningExperience)}</td>
  <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${e(w.criteria)}</td>
  <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;">${w.weight}%</td>
</tr>`;
}).join("")}
</table>`
  ) : "";

  // ── References
  const refSection = refList.length ? sec("Daftar Pustaka",
    `<ol style="margin:0;padding-left:20px;">${refList.map(r => `<li style="margin-bottom:4px;font-size:13px;">${e(r)}</li>`).join("")}</ol>`
  ) : "";

  return `<div style="font-family:Arial,sans-serif;max-width:960px;margin:0 auto;color:#1e293b;">
<div style="background:#1d4ed8;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
<h2 style="margin:0;font-size:20px;">Rencana Pembelajaran Semester (RPS)</h2>
<p style="margin:4px 0 0;opacity:.85;">${e(rps.courseName)}</p>
</div>

<div style="border:1px solid #dbeafe;border-top:0;padding:16px 20px;border-radius:0 0 8px 8px;">

<table border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;margin-bottom:4px;">
<tr><td style="background:#f1f5f9;font-weight:600;width:30%;padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">Nama Mata Kuliah</td><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${e(rps.courseName)}</td></tr>
<tr><td style="background:#f1f5f9;font-weight:600;padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">Kode MK</td><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${e(rps.courseCode) || "–"}</td></tr>
<tr><td style="background:#f1f5f9;font-weight:600;padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">SKS</td><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${e(rps.credits)} SKS</td></tr>
<tr><td style="background:#f1f5f9;font-weight:600;padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">Semester</td><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">Semester ${e(rps.semester)} — ${e(rps.semesterType)}</td></tr>
<tr><td style="background:#f1f5f9;font-weight:600;padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">Tahun Akademik</td><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${e(rps.academicYear)}</td></tr>
<tr><td style="background:#f1f5f9;font-weight:600;padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">Program Studi</td><td style="padding:8px 12px;font-size:13px;border-bottom:1px solid #e2e8f0;">${e(rps.program)}</td></tr>
<tr><td style="background:#f1f5f9;font-weight:600;padding:8px 12px;font-size:13px;">Prasyarat</td><td style="padding:8px 12px;font-size:13px;">${e(rps.prerequisite) || "–"}</td></tr>
</table>

${rps.description ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#475569;">${e(rps.description)}</p>` : ""}

${fileSection}
${cplSection}
${cpmkSection}
${assessmentSection}
${weeksSection}
${refSection}

</div>
</div>`;
}
