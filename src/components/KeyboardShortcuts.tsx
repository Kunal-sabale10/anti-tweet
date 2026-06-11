"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('open-tweet-modal'));
          break;
        case '/':
          e.preventDefault();
          const searchInput = document.getElementById('global-search-input');
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case 'm':
          e.preventDefault();
          router.push('/messages');
          break;
        case 'j':
        case 'k': {
          e.preventDefault();
          const tweetCards = Array.from(document.querySelectorAll('.tweet-card'));
          if (tweetCards.length === 0) return;

          const currentFocusedIndex = tweetCards.findIndex(card => card.classList.contains('focused-tweet'));
          let nextIndex = 0;

          if (e.key.toLowerCase() === 'j') {
            // Next
            nextIndex = currentFocusedIndex === -1 ? 0 : Math.min(currentFocusedIndex + 1, tweetCards.length - 1);
          } else {
            // Previous
            nextIndex = currentFocusedIndex === -1 ? 0 : Math.max(currentFocusedIndex - 1, 0);
          }

          tweetCards.forEach(card => card.classList.remove('focused-tweet'));
          const nextCard = tweetCards[nextIndex];
          nextCard.classList.add('focused-tweet');
          nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
        case 'l': {
          e.preventDefault();
          const focusedTweet = document.querySelector('.focused-tweet');
          if (focusedTweet) {
            // Look for a button containing Heart icon/text
            const buttons = Array.from(focusedTweet.querySelectorAll('button'));
            const likeButton = buttons.find(b => {
              // Try standard like label
              if (b.getAttribute('aria-label') === 'Like') return true;
              if (b.classList.contains('like-button')) return true;
              // Specific SVG check used in lucide-react
              const hasHeart = b.innerHTML.includes('lucide-heart');
              return hasHeart;
            });
            
            if (likeButton) {
              likeButton.click();
            }
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Global style for focused-tweet
  useEffect(() => {
    if (!document.getElementById('keyboard-shortcuts-styles')) {
      const style = document.createElement('style');
      style.id = 'keyboard-shortcuts-styles';
      style.innerHTML = `
        .focused-tweet {
          border: 2px solid #3b82f6 !important;
          outline: none;
          transition: border-color 0.2s;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return null;
}
