import { useEffect } from 'react';

/**
 * Wrapper around the WordPress TinyMCE editor.
 * Initializes and removes the editor on mount/unmount.
 */
export const WpEditor = ({ id, value, onChange }) => {
  useEffect(() => {
    let isMounted = true;

    // Clean up any existing editor instance with the same ID first
    if (window.wp && window.wp.editor) {
      try {
        window.wp.editor.remove(id);
      } catch (e) {
        // ignore
      }
    }

    // Small timeout ensures the DOM node is rendered and ready before TinyMCE hooks into it
    const timer = setTimeout(() => {
      if (!isMounted) return;
      const textarea = document.getElementById(id);
      if (!textarea) return;

      if (window.wp && window.wp.editor) {
        try {
          window.wp.editor.initialize(id, {
            tinymce: {
              wpautop: true,
              toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_more,spellchecker,fullscreen,wp_adv',
              toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
              setup: function(ed) {
                ed.on('init', function() {
                  if (value && !ed.getContent()) {
                    ed.setContent(value);
                  }
                });
                ed.on('change keyup NodeChange', function() {
                  ed.save();
                  const currentEl = document.getElementById(id);
                  const val = currentEl ? currentEl.value : ed.getContent();
                  onChange(val);
                });
              }
            },
            quicktags: true,
            mediaButtons: true,
          });
        } catch (err) {
          console.warn('WpEditor initialization error:', err);
        }
      }
    }, 20);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (window.wp && window.wp.editor) {
        try {
          window.wp.editor.remove(id);
        } catch (e) {
          // ignore
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="qoracrm-wp-editor-wrapper min-h-[160px]">
      <textarea 
        id={id} 
        className="wp-editor-area" 
        rows={5} 
        defaultValue={value} 
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.target.value)}
      ></textarea>
    </div>
  );
};
