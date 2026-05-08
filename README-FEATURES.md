# Windows 11 Desktop Clone - New Features

## 🎉 Recent Additions

### 1. Digital Clock with Multiple Timezones

**Features:**
- Real-time clock display with seconds
- Support for 4 major world timezones (New York, London, Tokyo, Sydney)
- Local time display in a prominent section
- Beautiful glassmorphism design
- Add timezone functionality
- Updates every second

**Technologies:**
- JavaScript `Date` API for timezone conversion
- `toLocaleTimeString()` for timezone-aware formatting
- Framer Motion for smooth animations

**Usage:**
```tsx
import { DigitalClock } from '@/components/DigitalClock';

<DigitalClock />
```

### 2. Joke Generator

**Features:**
- Fetch random jokes from Official Joke API
- Display setup and punchline
- Copy joke to clipboard
- Real-time API integration
- Loading states
- Fallback joke if API fails

**API Used:**
```
https://official-joke-api.appspot.com/random_joke
```

**Response Format:**
```json
{
  "type": "general",
  "setup": "Why did the API go to the bar?",
  "delivery": "Because it had too many requests!",
  "id": 123
}
```

**Usage:**
```tsx
import { JokeGenerator } from '@/components/JokeGenerator';

<JokeGenerator />
```

## 🔄 How to Integrate

1. **Update Desktop Icons** to trigger clock/joke:
   ```tsx
   <DesktopIcon 
     name="World Clock" 
     icon="Clock" 
     onClick={() => onOpenClock()}
   />
   <DesktopIcon 
     name="Joke Generator" 
     icon="Laugh" 
     onClick={() => onOpenJoke()}
   />
   ```

2. **Use EnhancedDesktop component** instead of Desktop:
   ```tsx
   import { EnhancedDesktop } from '@/components/EnhancedDesktop';
   
   export default function Home() {
     return <EnhancedDesktop />;
   }
   ```

## 📝 Customization

### Add More Timezones

Edit `src/components/DigitalClock.tsx`:
```tsx
const [timeZones, setTimeZones] = useState<TimeZone[]>([
  // Add more timezones here
  { id: '5', name: 'Dubai', timezone: 'Asia/Dubai', time: '' },
  { id: '6', name: 'Paris', timezone: 'Europe/Paris', time: '' },
]);
```

### Fetch from Different Joke API

Edit `src/components/JokeGenerator.tsx`:
```tsx
const response = await fetch('https://api.example.com/jokes');
```

**Alternative Joke APIs:**
- JokeAPI: `https://v2.jokeapi.dev/joke/Any`
- icanhazdadjoke: `https://icanhazdadjoke.com/`
- Jokes API: `https://jokes.one/jokes/random`

## 🚀 Future Enhancements

- [ ] Persistent timezone preferences
- [ ] 12/24 hour format toggle
- [ ] Alarm/timer functionality
- [ ] Multiple joke categories
- [ ] Share jokes to social media
- [ ] Joke history/favorites
- [ ] Keyboard shortcuts

## 🐛 Troubleshooting

### Clock not updating?
- Check browser console for errors
- Ensure timezone strings are valid IANA timezone identifiers

### Jokes not loading?
- Check network tab in DevTools
- Verify API endpoint is accessible
- Check CORS settings (Official Joke API allows public requests)

## 📚 Resources

- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [Official Joke API Docs](https://github.com/15Dkatz/official_joke_api)
- [IANA Timezone Database](https://www.iana.org/time-zones)
