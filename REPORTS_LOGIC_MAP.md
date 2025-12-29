### 🧠 Detailed Code Map

| File | Location | Logic Pattern |
| :--- | :--- | :--- |
| `App.tsx` | Line 19 | `export default function App() {` |
| `App.tsx` | Line 34 | `const fetchData = async () => {` |
| `App.tsx` | Line 65 | `const handleLogin = async (identifier: string, secret: strin` |
| `App.tsx` | Line 92 | `const handleSignUp = async (name: string, email: string, sec` |
| `App.tsx` | Line 111 | `const handleLogout = async () => {` |
| `App.tsx` | Line 118 | `const addUser = async (name: string, role: Role, mobile: str` |
| `App.tsx` | Line 126 | `// 2. Check for connection errors (e.g., wrong function name` |
| `App.tsx` | Line 133 | `// 3. Check for database errors returned INSIDE the function` |
| `App.tsx` | Line 144 | `const updateUser = async (userId: string, updates: Partial<U` |
| `App.tsx` | Line 158 | `const deleteUser = async (userId: string) => {` |
| `App.tsx` | Line 169 | `const createBatch = async (batchData: Partial<Batch>) => {` |
| `App.tsx` | Line 185 | `const finalizeCut = async (batchId: string, actualQty: SizeQ` |
| `App.tsx` | Line 198 | `const assignToKarigar = async (batchId: string, karigarId: s` |
| `App.tsx` | Line 234 | `const updateAssignmentStatus = async (batchId: string, assig` |
| `App.tsx` | Line 246 | `const handleQCSubmit = async (batchId: string, assignmentId:` |
| `App.tsx` | Line 280 | `const handleTransaction = async (userId: string, amount: num` |
| `App.tsx` | Line 300 | `const handleArchive = async (batchId: string) => {` |
| `Login.tsx` | Line 27 | `const handleSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 69 | `const handleShopifySync = () => {` |
| `ManagerDashboard.tsx` | Line 85 | `const handleImageUpload = async (e: React.ChangeEvent<HTMLIn` |
| `ManagerDashboard.tsx` | Line 116 | `const handleSubmitBatch = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 130 | `const openCutModal = (batch: Batch) => {` |
| `ManagerDashboard.tsx` | Line 135 | `const handleCutSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 141 | `const openAssignModal = (batch: Batch) => {` |
| `ManagerDashboard.tsx` | Line 148 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 159 | `const openInspectModal = (item: any) => {` |
| `ManagerDashboard.tsx` | Line 165 | `const handleQCSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 173 | `const handleQCQtyChange = (size: string, val: number) => {` |
| `ManagerDashboard.tsx` | Line 270 | `const totalAvailable = (Object.values(batch.availableQty) as` |
| `AdminDashboard.tsx` | Line 80 | `const getActiveAssignments = (userId: string) => {` |
| `AdminDashboard.tsx` | Line 88 | `const handleShopifySync = () => {` |
| `AdminDashboard.tsx` | Line 104 | `const handleImageUpload = async (e: React.ChangeEvent<HTMLIn` |
| `AdminDashboard.tsx` | Line 130 | `const handleSubmitBatch = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 144 | `const openBatchDetails = (batch: Batch) => {` |
| `AdminDashboard.tsx` | Line 149 | `const openAssignModal = () => {` |
| `AdminDashboard.tsx` | Line 157 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 166 | `const handleAddUser = async (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 183 | `const openPassbook = (userId: string) => {` |
| `AdminDashboard.tsx` | Line 188 | `const submitPayment = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 50 | `const openCutModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 55 | `const handleCutSubmit = async (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 73 | `const openAssignModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 83 | `const handleSelectKarigar = (karigarId: string) => {` |
| `MasterDashboard.tsx` | Line 88 | `const handleAssignSubmit = async (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 196 | `const totalAvailable = (Object.values(batch.availableQty) as` |
| `KarigarDashboard.tsx` | Line 53 | `const calculateTotalQty = (qty: SizeQty) => Object.values(qt` |
| `KarigarDashboard.tsx` | Line 58 | `const handlePhotoUpload = async (e: React.ChangeEvent<HTMLIn` |
| `QCDashboard.tsx` | Line 34 | `const openInspectModal = (item: any) => {` |
| `QCDashboard.tsx` | Line 40 | `const handleSubmit = async (e: React.FormEvent) => {` |
| `QCDashboard.tsx` | Line 74 | `const handleQtyChange = (size: string, val: number) => {` |
| `QCDashboard.tsx` | Line 82 | `const totalPassed = (Object.values(qcForm) as number[]).redu` |
| `QCDashboard.tsx` | Line 198 | `function formatDate(dateStr?: string) {` |