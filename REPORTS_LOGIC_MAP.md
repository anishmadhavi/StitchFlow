### 🧠 Detailed Code Map

| File | Location | Logic Pattern |
| :--- | :--- | :--- |
| `App.tsx` | Line 12 | `export default function App() {` |
| `App.tsx` | Line 24 | `const fetchData = async () => {` |
| `App.tsx` | Line 48 | `const handleLogin = async (mobile: string, pin: string) => {` |
| `App.tsx` | Line 80 | `const handleLogout = async () => {` |
| `App.tsx` | Line 87 | `const createBatch = async (batchData: Partial<Batch>) => {` |
| `App.tsx` | Line 105 | `const addUser = async (name: string, role: Role, mobile: str` |
| `Login.tsx` | Line 27 | `const handleSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 68 | `const handleShopifySync = () => {` |
| `ManagerDashboard.tsx` | Line 84 | `const handleImageUpload = (e: React.ChangeEvent<HTMLInputEle` |
| `ManagerDashboard.tsx` | Line 95 | `const handleSubmitBatch = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 109 | `const openCutModal = (batch: Batch) => {` |
| `ManagerDashboard.tsx` | Line 114 | `const handleCutSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 120 | `const openAssignModal = (batch: Batch) => {` |
| `ManagerDashboard.tsx` | Line 127 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 138 | `const openInspectModal = (item: any) => {` |
| `ManagerDashboard.tsx` | Line 144 | `const handleQCSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 152 | `const handleQCQtyChange = (size: string, val: number) => {` |
| `ManagerDashboard.tsx` | Line 249 | `const totalAvailable = (Object.values(batch.availableQty) as` |
| `AdminDashboard.tsx` | Line 79 | `const getActiveAssignments = (userId: string) => {` |
| `AdminDashboard.tsx` | Line 87 | `const handleShopifySync = () => {` |
| `AdminDashboard.tsx` | Line 103 | `const handleImageUpload = async (e: React.ChangeEvent<HTMLIn` |
| `AdminDashboard.tsx` | Line 134 | `const handleSubmitBatch = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 148 | `const openBatchDetails = (batch: Batch) => {` |
| `AdminDashboard.tsx` | Line 153 | `const openAssignModal = () => {` |
| `AdminDashboard.tsx` | Line 161 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 170 | `const handleAddUser = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 177 | `const openPassbook = (userId: string) => {` |
| `AdminDashboard.tsx` | Line 182 | `const submitPayment = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 49 | `const openCutModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 54 | `const handleCutSubmit = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 60 | `const openAssignModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 70 | `const handleSelectKarigar = (karigarId: string) => {` |
| `MasterDashboard.tsx` | Line 75 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 157 | `const totalAvailable = (Object.values(batch.availableQty) as` |
| `KarigarDashboard.tsx` | Line 52 | `const calculateTotalQty = (qty: SizeQty) => Object.values(qt` |
| `KarigarDashboard.tsx` | Line 57 | `const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputEle` |
| `QCDashboard.tsx` | Line 33 | `const openInspectModal = (item: any) => {` |
| `QCDashboard.tsx` | Line 39 | `const handleSubmit = (e: React.FormEvent) => {` |
| `QCDashboard.tsx` | Line 47 | `const handleQtyChange = (size: string, val: number) => {` |
| `QCDashboard.tsx` | Line 55 | `const totalPassed = (Object.values(qcForm) as number[]).redu` |
| `QCDashboard.tsx` | Line 171 | `function formatDate(dateStr?: string) {` |