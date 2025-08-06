/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        scrollbar: {
          thumb: '#d1d5db',
          track: '#f3f4f6',
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#d1d5db #f3f4f6',
        },
        '.scrollbar-thumb-gray-300': {
          '&::-webkit-scrollbar-thumb': {
            'background-color': '#d1d5db',
            'border-radius': '6px',
          },
        },
        '.scrollbar-track-gray-100': {
          '&::-webkit-scrollbar-track': {
            'background-color': '#f3f4f6',
            'border-radius': '6px',
          },
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          'background-color': '#f3f4f6',
          'border-radius': '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          'background-color': '#d1d5db',
          'border-radius': '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          'background-color': '#9ca3af',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
