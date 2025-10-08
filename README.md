# YanToDoList

A modern, intelligent todo list application built with Next.js 15, featuring advanced task recommendation algorithms, data import/export capabilities, and a sleek, responsive UI with dark mode support.

## 🚀 Features

### Core Functionality
- ✅ Create, edit, and delete tasks
- 📅 Set due dates with visual status indicators
- 🎯 Priority levels (Low, High)
- 📊 Task statistics and analytics
- 🌓 Automatic dark/light mode support
- 💾 Local storage persistence
- 📤 **Export tasks to JSON files**
- 📥 **Import tasks from backup files**

### Advanced Features
- 🧠 **YanAlgorithm**: Intelligent task recommendation system
- 🎲 **Weighted Random Selection**: Smart task suggestions based on priorities and due dates
- ⚖️ **Half Weight Mode**: Use half of the calculated total weight for modified algorithm behavior
- 🤓 **Debug Mode**: Detailed algorithm statistics and development tools
- ⚙️ **Customizable Base Values**: Override calculated weights with custom values
- 🔔 **Smart Notifications**: Toast notifications for user feedback

## 🧮 YanAlgorithm Explained

The YanAlgorithm is a sophisticated weighted random selection system that helps prioritize tasks based on multiple factors:

### Weight Calculation
Tasks are assigned weights based on:
- **Due Date Proximity**: Closer due dates = higher weight
- **Priority Level**: High (2x), Low (1x) multipliers
- **Overdue Tasks**: Special handling for overdue items

### Algorithm Modes
1. **Standard Mode**: Uses calculated total weight as base
2. **Half Weight Mode**: Uses 50% of total weight as base (more randomness)
3. **Custom Base Mode**: Override with user-defined base value

### Random Generation Process
1. Calculate weighted probabilities for each category
2. Generate random value within sum range
3. Select category using cumulative distribution
4. Higher weights = higher selection probability

## 📁 Data Management

### Export Functionality
- **Comprehensive Export**: Exports all tasks with metadata
- **JSON Format**: Clean, readable format with version tracking
- **Timestamped Files**: Automatic filename with date/time
- **Metadata Included**: Task counts and export information
- **File Format**: `yan-todolist-export-YYYY-MM-DD-HH-mm.json`

### Import Functionality
- **Flexible Import**: Add to existing tasks or replace all
- **Error Handling**: Validates file format and task structure
- **Data Recovery**: Handles corrupted or partial data gracefully
- **User Choice**: Confirms import method before proceeding
- **Smart Validation**: Ensures imported tasks have valid properties

### Export File Structure
```json
{
  "tasks": [...],
  "exportedAt": "2025-09-29T12:00:00.000Z",
  "version": "1.0",
  "metadata": {
    "totalTasks": 10,
    "completedTasks": 3,
    "activeTasks": 7
  }
}
```

## 🎯 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd yantodolist

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🎨 UI Features

### Modern Design
- Clean, card-based layout
- Smooth animations and transitions
- Responsive design for all screen sizes
- Professional color scheme
- Toast notifications for user feedback

### Dark Mode Support
- Automatic system preference detection
- Consistent theming across all components
- CSS custom properties for seamless switching

### Visual Indicators
- 🔴 **Overdue**: Red border and indicators
- 🟡 **Due Soon**: Yellow/orange indicators  
- 🟢 **On Track**: Green indicators
- ⭐ **Priority**: Color-coded priority badges (Green=Low, Red=High)
- 💾 **Data Management**: Clear export/import controls

## 🛠️ Technical Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Turbopack

## 📈 Advanced Settings

### Task Recommendations
Enable AI-powered task suggestions that use the YanAlgorithm to recommend which task to work on next based on:
- Task priorities
- Due date urgency  
- Historical completion patterns

### Half Weight Algorithm
Activates modified weight calculation:
- Reduces algorithm determinism
- Increases randomness in selection
- Useful for breaking routine patterns
- Formula: `base = total_weight ÷ 2`

### Data Management
- **Export**: Download all tasks as JSON with metadata
- **Import**: Upload JSON files to restore or add tasks
- **Backup Strategy**: Regular exports recommended for data safety
- **Migration**: Easy transfer between devices or browsers

### Stats for Nerds
Developer mode that displays:
- Individual task weights and probabilities
- Algorithm execution details
- Base calculation methods
- Real-time debugging information
- Import/export statistics

## 📱 Responsive Design

- **Mobile**: Optimized touch interface with accessible buttons
- **Tablet**: Balanced layout and interactions
- **Desktop**: Full feature set with keyboard shortcuts

## 🔧 Configuration

### Environment Variables
No environment variables required - fully client-side application.

### Local Storage
The app automatically saves:
- All tasks and their metadata
- User preferences and settings
- Algorithm configuration
- No data leaves your device

## 🔒 Privacy & Security

- **100% Client-Side**: No data sent to external servers
- **Local Storage Only**: All data stays on your device
- **No Tracking**: No analytics or user tracking
- **Export Control**: You control your data exports

## 💡 Usage Tips

### Best Practices
1. **Regular Exports**: Create backups of your tasks periodically
2. **Priority Management**: Use priority levels to help the algorithm
3. **Due Date Setting**: Set realistic due dates for better recommendations
4. **Half Weight Mode**: Try this mode if recommendations feel too predictable

### Keyboard Shortcuts
- **Enter**: Add new task when in input field
- **Escape**: Cancel editing operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues
- **Import Fails**: Ensure JSON file is valid and from YanToDoList
- **Export Not Working**: Check browser allows file downloads
- **Data Lost**: Use exported backup files to restore

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Optimized experience

## 📄 License

Created by **Ethan Yan Xu** - Visit [ethanyanxu.com](https://ethanyanxu.com)

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Tailwind CSS for the utility-first styling approach
- Lucide for the beautiful icon set
- The open-source community for inspiration

---

**Made with ❤️ by Ethan Yan Xu**
