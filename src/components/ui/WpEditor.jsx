import { useEffect } from 'react';

/**
 * Wrapper around the WordPress TinyMCE editor.
 * Initializes and removes the editor on mount/unmount.
 */
export const WpEditor = ({ id, value, onChange }) => {
  useEffect(() => {
    if (window.wp && window.wp.editor) {
      window.wp.editor.initialize(id, {
        tinymce: {
          wpautop: true,
          toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_more,spellchecker,fullscreen,wp_adv',
          toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
          setup: function(ed) {
            ed.on('change keyup', function() {
              ed.save();
              const val = document.getElementById(id).value;
              onChange(val);
            });
          }
        },
        quicktags: true,
        mediaButtons: true,
      });
    }

    return () => {
      if (window.wp && window.wp.editor) {
        window.wp.editor.remove(id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="qoracrm-wp-editor-wrapper">
      <textarea 
        id={id} 
        className="wp-editor-area" 
        rows={5} 
        defaultValue={value} 
        onBlur={(e) => onChange(e.target.value)}
      ></textarea>
    </div>
  );
};
