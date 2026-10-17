import { ShieldCheck } from 'lucide-react';
import { courseInfo, teamMembers } from '../data/team';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import TeamMemberCard from '../components/ui/TeamMemberCard';
import styles from './AboutPage.module.css';

const TAGS = ['Firewall-focused', 'React.js', 'In-memory data · Part 1'];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="About CyberTrack" subtitle="Project, course and team information" />

      <Card className={styles.overview}>
        <div className={styles.overviewBody}>
          <span className={styles.overviewIcon} aria-hidden="true">
            <ShieldCheck size={28} />
          </span>
          <div>
            <h2 className={styles.overviewTitle}>CyberTrack — Firewall Asset Management System</h2>
            <p className={styles.overviewText}>
              CyberTrack helps organizations maintain a centralized, accurate inventory of their firewall
              devices: register, search, update and retire firewalls from one interface.
            </p>
            <ul className={styles.tags} aria-label="Project highlights">
              {TAGS.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Course Information" titleId="course-heading" className={styles.course}>
        <dl className={styles.courseList}>
          <dt>Course</dt>
          <dd>{courseInfo.course}</dd>
          <dt>Semester</dt>
          <dd>{courseInfo.semester}</dd>
          <dt>Deliverable</dt>
          <dd>{courseInfo.deliverable}</dd>
        </dl>
      </Card>

      <section aria-labelledby="team-heading" className={styles.team}>
        <h2 id="team-heading" className={styles.teamTitle}>
          Project Team
        </h2>
        <ul className={styles.teamGrid}>
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} index={index} name={member.name} studentId={member.studentId} />
          ))}
        </ul>
      </section>
    </>
  );
}
