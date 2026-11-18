// Build log page (/build-log). Content: content/build-log.js (content document v4).
// Milestones show their real status only. Posts appear once published; until then the page
// shows what each post will contain, with no invented updates.
import { useRef } from 'react';
import Icon from '../components/Icon.jsx';
import { Section, SectionHead } from '../components/gajju/Section.jsx';
import { MediaLabel, StatusLabel } from '../components/gajju/Labels.jsx';
import { PageHero, IconList, JoinSection, ICON } from '../components/gajju/PageParts.jsx';
import { useReveals } from '../hooks/useReveals.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { BUILD_LOG, MILESTONES, POSTS } from '../content/build-log.js';

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

function PostMedia({ post }) {
  if (post.video) {
    return (
      <figure className="gj-post__media">
        <video controls playsInline preload="none" poster={post.cover?.src} src={post.video.src}>
          {post.video.captions && <track kind="captions" src={post.video.captions} srcLang="en" label="English" default />}
        </video>
        {post.video.label && <MediaLabel>{post.video.label}</MediaLabel>}
      </figure>
    );
  }
  if (post.cover) {
    return (
      <figure className="gj-post__media">
        <img src={post.cover.src} alt={post.cover.alt} loading="lazy" decoding="async" />
        {post.cover.label && <MediaLabel>{post.cover.label}</MediaLabel>}
      </figure>
    );
  }
  return null;
}

function Posts() {
  // Newest first, as the content document asks.
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  if (!posts.length) {
    return (
      <div className="gj-log__empty">
        <div className="gj-card gj-card--highlight" data-reveal>
          <StatusLabel tone="planned">No posts yet</StatusLabel>
          <h3 className="gj-h3">{BUILD_LOG.emptyTitle}</h3>
          <p>{BUILD_LOG.emptyText}</p>
          <a className="gj-btn gj-btn--primary" href="#join">
            {BUILD_LOG.button}
          </a>
        </div>
        <div className="gj-card" data-reveal>
          <h3 className="gj-h3">{BUILD_LOG.templateTitle}</h3>
          <IconList items={BUILD_LOG.template} className="gj-log__outline gj-after" />
        </div>
      </div>
    );
  }
  return (
    <ol className="gj-grid gj-grid--3">
      {posts.map((post) => (
        <li key={post.slug} id={post.slug}>
          <article className="gj-card gj-post">
            <PostMedia post={post} />
            <p className="gj-caption">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </p>
            <h3 className="gj-h3">{post.title}</h3>
            <p>{post.summary}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}

export default function BuildLog() {
  usePageMeta('/build-log');
  const mainRef = useRef(null);
  useReveals(mainRef);

  return (
    <main id="main" className="gj" ref={mainRef}>
      <PageHero eyebrow="Build log" title={BUILD_LOG.title} lead={BUILD_LOG.lead}>
        <a className="gj-btn gj-btn--primary" href="#join">
          <Icon name="mail" {...ICON} />
          {BUILD_LOG.button}
        </a>
      </PageHero>

      <Section id="milestones" tone="paper" labelledBy="gj-milestones-title">
        <SectionHead id="gj-milestones-title" title={BUILD_LOG.milestonesTitle} />
        <ol className="gj-log">
          {MILESTONES.map((m) => (
            <li className={`gj-log__item is-${m.status}`} key={m.text} data-reveal>
              <span className="gj-log__dot" aria-hidden="true">
                {m.status === 'done' && <Icon name="check" {...ICON} />}
              </span>
              <div className="gj-card gj-log__card">
                <div className="gj-log__meta">
                  <StatusLabel tone={m.status}>{m.label}</StatusLabel>
                  <span className="gj-timeline__when">{m.when}</span>
                </div>
                <p>{m.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="gj-caption gj-after">{BUILD_LOG.milestonesNote}</p>
      </Section>

      <Section id="posts" tone="cream" labelledBy="gj-posts-title">
        <SectionHead id="gj-posts-title" title={BUILD_LOG.postsTitle} />
        <Posts />
      </Section>

      {/* Content document: "adds the email to the sign-up list, tagged 'build log'". */}
      <JoinSection tone="paper" title="Get new posts by email." lead={BUILD_LOG.joinLead} tags={['build-log']} />
    </main>
  );
}
