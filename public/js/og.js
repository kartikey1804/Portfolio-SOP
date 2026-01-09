// public/js/og.js

/**
 * Updates Open Graph (OG) meta tags dynamically.
 * This can be used as a client-side fallback or for dynamic content updates.
 * @param {object} options - An object containing the OG properties to update.
 * @param {string} [options.title] - The title for the OG tag.
 * @param {string} [options.description] - The description for the OG tag.
 * @param {string} [options.image] - The URL of the image for the OG tag.
 * @param {string} [options.url] - The canonical URL for the OG tag.
 */
function updateOgMeta(options) {
    const setMeta = (property, content) => {
        let element = document.querySelector(`meta[property="og:${property}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', `og:${property}`);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    if (options.title) {
        setMeta('title', options.title);
    }
    if (options.description) {
        setMeta('description', options.description);
    }
    if (options.image) {
        setMeta('image', options.image);
    }
    if (options.url) {
        setMeta('url', options.url);
    }
}

// Example usage (can be called from main.ts or other scripts if needed)
document.addEventListener('DOMContentLoaded', () => {
    // You can call updateOgMeta here with dynamic content if needed
    // For now, it will rely on the static meta tags in index.html
    // or be called by main.ts after fetching dynamic content.
    // console.log("OG meta helper loaded.");
});

export { updateOgMeta };
