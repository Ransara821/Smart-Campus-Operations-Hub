import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { QrCode, CheckCircle2, XCircle, Scan, AlertTriangle, Lock, Users } from 'lucide-react';

export const QRVerificationPage = () => {
    const [searchParams] = useSearchParams();
    const [qrData, setQrData] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // User identification for multi-student check-in
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [studentId, setStudentId] = useState('');
    const [showUserForm, setShowUserForm] = useState(false);

    // Auto-verify if QR code is in URL parameter
    useEffect(() => {
        let qrParam = searchParams.get('qrData');
        if (qrParam && !verificationResult) {
            // If qrParam is a full URL (contains http), extract just the token
            if (qrParam.includes('http')) {
                // Extract token from URL like: http://...verify-qr?qrData=TOKEN
                const match = qrParam.match(/qrData=([^&]+)/);
                if (match && match[1]) {
                    qrParam = decodeURIComponent(match[1]);
                    console.log('Extracted token from URL:', qrParam);
                }
            }
            qrParam = qrParam.trim(); // Remove any whitespace
            console.log('QR Data from URL:', qrParam);
            setQrData(qrParam);
            // Show user form for multi-student check-ins
            setShowUserForm(true);
        }
    }, [searchParams, verificationResult]);

    const verifyQRCode = async (dataToVerify, withUserInfo = false) => {
        let qrValue = dataToVerify || qrData;
        if (!qrValue.trim()) return;

        // Clean the QR value - extract just the token if it's a full URL
        qrValue = qrValue.trim(); // Remove whitespace
        
        if (qrValue.includes('http') || qrValue.includes('verify-qr')) {
            const match = qrValue.match(/qrData=([^&]+)/);
            if (match && match[1]) {
                qrValue = decodeURIComponent(match[1]);
                console.log('Cleaned QR token:', qrValue);
            }
        }
        
        // Additional cleanup - remove any remaining URL encoding artifacts
        qrValue = qrValue.trim();

        setLoading(true);
        try {
            console.log('Verifying QR code:', qrValue);
            
            // Build query parameters
            let url = `/api/bookings/verify-qr?qrData=${encodeURIComponent(qrValue)}`;
            
            // Add user info if provided (for multi-student check-in)
            if (withUserInfo && userName.trim()) {
                // Validate that Student ID is provided for multi-student check-ins
                if (!studentId.trim() && !userEmail.trim()) {
                    alert('⚠️ Student ID or Email is required to prevent duplicate check-ins');
                    setLoading(false);
                    return;
                }
                
                // Create a consistent userId: prefer studentId, then email
                let userId;
                if (studentId.trim()) {
                    userId = studentId.trim().toUpperCase(); // Normalize student IDs to uppercase
                } else if (userEmail.trim()) {
                    userId = userEmail.trim().toLowerCase();
                } else {
                    // This should never happen due to validation above
                    userId = userName.trim().toLowerCase().replace(/\s+/g, '-');
                }
                
                url += `&userId=${encodeURIComponent(userId)}`;
                url += `&userName=${encodeURIComponent(userName.trim())}`;
                if (userEmail.trim()) {
                    url += `&userEmail=${encodeURIComponent(userEmail.trim())}`;
                }
                if (studentId.trim()) {
                    url += `&studentId=${encodeURIComponent(studentId.trim().toUpperCase())}`;
                }
                
                console.log('🎫 Check-in attempt:');
                console.log('   Name:', userName.trim());
                console.log('   Student ID:', studentId.trim() || '(none)');
                console.log('   Unique ID:', userId);
                console.log('   Email:', userEmail.trim() || '(none)');
                console.log('   URL:', url);
            }
            
            const res = await axios.get(url);
            console.log('✅ Check-in SUCCESS:', res.data);
            
            // Success - valid booking with check-in
            setVerificationResult({
                type: 'SUCCESS',
                data: res.data
            });
            setShowUserForm(false);
        } catch (error) {
            const errorData = error.response?.data;
            const errorType = errorData?.error;
            
            if (errorType === 'ACCESS_DENIED') {
                setVerificationResult({
                    type: 'ACCESS_DENIED',
                    message: errorData.message
                });
            } else if (errorType === 'ALREADY_CHECKED_IN') {
                setVerificationResult({
                    type: 'ALREADY_CHECKED_IN',
                    message: errorData.message,
                    checkedInAt: errorData.checkedInAt,
                    booking: errorData.booking,
                    totalAttendees: errorData.totalAttendees,
                    expectedAttendees: errorData.expectedAttendees
                });
            } else if (errorType === 'NOT_ALLOWED') {
                setVerificationResult({
                    type: 'NOT_ALLOWED',
                    message: errorData.message,
                    status: errorData.status
                });
            } else if (errorType === 'TOO_EARLY' || errorType === 'EXPIRED') {
                setVerificationResult({
                    type: 'TIME_ERROR',
                    message: errorData.message,
                    errorType: errorType
                });
            } else if (errorType === 'INVALID_QR') {
                setVerificationResult({
                    type: 'INVALID_QR',
                    message: errorData.message
                });
            } else {
                setVerificationResult({
                    type: 'INVALID_QR',
                    message: error.response?.data?.message || 'This QR code is not recognized.'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        
        // Show user form before verifying if userName is empty
        if (!userName.trim() && !verificationResult) {
            setShowUserForm(true);
            return;
        }
        
        verifyQRCode(null, true);
    };
    
    const handleQuickVerify = (e) => {
        e.preventDefault();
        // Quick verify without user info (for equipment bookings)
        verifyQRCode(null, false);
    };

    const resetForm = () => {
        setQrData('');
        setVerificationResult(null);
        setUserName('');
        setUserEmail('');
        setStudentId('');
        setShowUserForm(false);
    };

    const renderResult = () => {
        if (!verificationResult) return null;

        switch (verificationResult.type) {
            case 'SUCCESS':
                const booking = verificationResult.data.booking;
                const checkedInAt = verificationResult.data.checkedInAt;
                const attendanceMode = verificationResult.data.attendanceMode;
                const totalAttendees = verificationResult.data.totalAttendees;
                const expectedAttendees = verificationResult.data.expectedAttendees;
                
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <CheckCircle2 className="w-20 h-20 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-green-600 mb-2">✅ Check-in Successful</h2>
                        <p className="text-lg text-gray-600 mb-4">Access granted for this booking</p>
                        
                        {/* Show attendance count for multi-student check-ins */}
                        {attendanceMode === 'MULTI_STUDENT' && (
                            <div className="mb-6 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-full">
                                <Users className="w-6 h-6 text-blue-600" />
                                <span className="text-xl font-bold text-gray-800">
                                    {totalAttendees} / {expectedAttendees} Students Checked In
                                </span>
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 text-left max-w-lg mx-auto border-2 border-green-200 shadow-lg">
                            <h3 className="font-bold text-xl text-gray-800 mb-4 pb-3 border-b border-green-200">Booking Details</h3>
                            <div className="space-y-4">
                                {userName && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Checked in as:</span>
                                        <p className="font-bold text-lg text-green-600">{userName}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm font-medium text-gray-500">QR Code:</span>
                                    <p className="font-bold text-lg text-blue-600 font-mono break-all">{booking.qrValidationData}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Booking ID:</span>
                                    <p className="font-semibold text-gray-800 font-mono">BK-{booking.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Resource:</span>
                                    <p className="font-bold text-xl text-gray-900">{booking.resourceName}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Date & Time:</span>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(booking.startTime).toLocaleDateString('en-CA')}, {new Date(booking.startTime).toLocaleTimeString('en-US', { 
                                            hour: '2-digit', minute: '2-digit', hour12: false 
                                        })}–{new Date(booking.endTime).toLocaleTimeString('en-US', { 
                                            hour: '2-digit', minute: '2-digit', hour12: false 
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Booked by:</span>
                                    <p className="font-semibold text-gray-800">{booking.userName}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Purpose:</span>
                                    <p className="font-semibold text-gray-800">{booking.purpose}</p>
                                </div>
                                <div className="pt-3 border-t border-green-200">
                                    <span className="text-sm font-medium text-gray-500">Status:</span>
                                    <p className="inline-block px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold ml-2">
                                        CHECKED_IN
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Checked-in at:</span>
                                    <p className="font-bold text-green-600">
                                        {new Date(checkedInAt).toLocaleTimeString('en-US', {
                                            hour: 'numeric', minute: '2-digit', hour12: true
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-green-200">
                                <p className="text-sm text-green-700 italic flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Notification sent to user
                                </p>
                            </div>
                        </div>
                        
                        {/* Check in another student button for multi-student mode */}
                        {attendanceMode === 'MULTI_STUDENT' && totalAttendees < expectedAttendees && (
                            <button
                                onClick={() => {
                                    // Clear user info but keep QR data
                                    setUserName('');
                                    setUserEmail('');
                                    setStudentId('');
                                    setVerificationResult(null);
                                    setShowUserForm(true);
                                }}
                                className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                            >
                                <Users className="w-5 h-5" />
                                Check in Another Student
                            </button>
                        )}
                    </div>
                );

            case 'ALREADY_CHECKED_IN':
                const alreadyTotalAttendees = verificationResult.totalAttendees;
                const alreadyExpectedAttendees = verificationResult.expectedAttendees;
                const existingStudentId = verificationResult.studentId;
                const existingName = verificationResult.existingName;
                
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <AlertTriangle className="w-20 h-20 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-600 mb-2">⚠️ Duplicate Check-In Blocked</h2>
                        
                        {/* Enhanced error message */}
                        <div className="bg-red-50 rounded-xl p-6 text-center max-w-lg mx-auto border-2 border-red-300 mb-6">
                            <p className="text-lg font-semibold text-red-800 mb-3">
                                {verificationResult.message}
                            </p>
                            
                            {(existingStudentId || existingName) && (
                                <div className="mt-4 pt-4 border-t border-red-300">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Already Checked In As:</p>
                                    {existingName && (
                                        <p className="font-bold text-lg text-gray-900">👤 {existingName}</p>
                                    )}
                                    {existingStudentId && (
                                        <p className="font-bold text-md text-blue-700 mt-1">🆔 Student ID: {existingStudentId}</p>
                                    )}
                                    <p className="text-xs text-gray-600 mt-2">
                                        at {new Date(verificationResult.checkedInAt).toLocaleTimeString('en-US', {
                                            hour: 'numeric', minute: '2-digit', hour12: true
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Show attendance count if available */}
                        {alreadyTotalAttendees !== undefined && (
                            <div className="mb-6 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-full">
                                <Users className="w-6 h-6 text-yellow-600" />
                                <span className="text-xl font-bold text-gray-800">
                                    {alreadyTotalAttendees} / {alreadyExpectedAttendees} Students Checked In
                                </span>
                            </div>
                        )}
                        
                        {/* Info box */}
                        <div className="bg-blue-50 rounded-xl p-4 text-left max-w-md mx-auto border border-blue-200 mt-4">
                            <p className="text-sm text-blue-800 flex items-start gap-2">
                                <span className="text-lg">ℹ️</span>
                                <span>Each Student ID can only be used once per session to ensure accurate attendance tracking.</span>
                            </p>
                        </div>
                        
                        {/* Try another student button */}
                        {alreadyTotalAttendees !== undefined && alreadyTotalAttendees < alreadyExpectedAttendees && (
                            <button
                                onClick={() => {
                                    // Clear user info but keep QR data
                                    setUserName('');
                                    setUserEmail('');
                                    setStudentId('');
                                    setVerificationResult(null);
                                    setShowUserForm(true);
                                }}
                                className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 mx-auto"
                            >
                                <Users className="w-5 h-5" />
                                Check in Different Student
                            </button>
                        )}
                    </div>
                );

            case 'INVALID_QR':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <XCircle className="w-20 h-20 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-600 mb-2">❌ Invalid QR Code</h2>
                        <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto border-2 border-red-200 mt-6">
                            <p className="text-lg text-gray-700">{verificationResult.message}</p>
                        </div>
                    </div>
                );

            case 'NOT_ALLOWED':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <XCircle className="w-20 h-20 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-600 mb-2">❌ Not Allowed</h2>
                        <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto border-2 border-red-200 mt-6">
                            <p className="text-lg font-semibold text-gray-800 mb-2">Reason:</p>
                            <p className="text-lg text-gray-700">{verificationResult.message}</p>
                            {verificationResult.status && (
                                <p className="mt-3 text-sm text-gray-600">Booking Status: <span className="font-bold">{verificationResult.status}</span></p>
                            )}
                        </div>
                    </div>
                );

            case 'TIME_ERROR':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <XCircle className="w-20 h-20 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-red-600 mb-2">❌ Not Allowed</h2>
                        <div className="bg-red-50 rounded-xl p-6 max-w-md mx-auto border-2 border-red-200 mt-6">
                            <p className="text-lg text-gray-700">{verificationResult.message}</p>
                        </div>
                    </div>
                );

            case 'ACCESS_DENIED':
                return (
                    <div className="text-center">
                        <div className="w-28 h-28 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in-95 duration-300">
                            <Lock className="w-20 h-20 text-purple-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-purple-600 mb-2">🔒 Access Denied</h2>
                        <div className="bg-purple-50 rounded-xl p-6 max-w-md mx-auto border-2 border-purple-200 mt-6">
                            <p className="text-lg text-gray-700">{verificationResult.message}</p>
                            <p className="text-sm text-gray-600 mt-3">Please login with appropriate permissions.</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-8 w-full max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">QR Code Verification</h1>
                <p className="text-gray-600">Scan or enter QR code to verify booking check-in</p>
            </div>

            {!verificationResult ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <QrCode className="w-12 h-12 text-primary-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {showUserForm ? 'Student Check-In' : 'Enter QR Code Data'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {showUserForm ? 'Please enter your details to check in' : 'Paste the QR code content below to verify'}
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="max-w-md mx-auto space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                QR Code Data
                            </label>
                            <textarea
                                value={qrData}
                                onChange={e => setQrData(e.target.value)}
                                placeholder="Paste QR code data here..."
                                rows="3"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                                required
                                disabled={showUserForm}
                            ></textarea>
                            {qrData && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Length: {qrData.length} characters
                                </p>
                            )}
                        </div>
                        
                        {showUserForm && (
                            <>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                        <p className="text-sm font-medium text-blue-800 mb-1">
                                            🔒 Unique Identifier Required
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            Student ID or Email is required to prevent duplicate check-ins
                                        </p>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={e => setUserName(e.target.value)}
                                        placeholder="e.g., John Doe"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Student ID <span className="text-red-500">* (Required)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={studentId}
                                        onChange={e => setStudentId(e.target.value)}
                                        placeholder="e.g., 2024001234"
                                        className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50"
                                        required={!userEmail.trim()}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Or provide Email below</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email <span className="text-gray-400">(Alternative to Student ID)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={userEmail}
                                        onChange={e => setUserEmail(e.target.value)}
                                        placeholder="e.g., john.doe@university.edu"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading || !qrData.trim() || (showUserForm && !userName.trim())}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-50"
                            >
                                <Scan className="w-5 h-5" />
                                {loading ? 'Verifying...' : showUserForm ? 'Check In' : 'Next'}
                            </button>
                            
                            {!showUserForm && qrData.trim() && (
                                <button
                                    type="button"
                                    onClick={handleQuickVerify}
                                    disabled={loading}
                                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition disabled:opacity-50 text-sm"
                                    title="For equipment bookings (single check-in)"
                                >
                                    Quick
                                </button>
                            )}
                        </div>
                        
                        {!showUserForm && (
                            <p className="text-xs text-center text-gray-500 mt-2">
                                💡 Click "Next" for student check-in or "Quick" for equipment
                            </p>
                        )}
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                    {renderResult()}
                    
                    <div className="flex justify-center mt-8 gap-4">
                        <button
                            onClick={resetForm}
                            className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition shadow-md"
                        >
                            {verificationResult.type === 'SUCCESS' ? 'Done' : verificationResult.type === 'ALREADY_CHECKED_IN' ? 'Back' : 'Try Again'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
