import sys

file_path = r'D:\DATN\CoRide\docs\baicao\latex_build\Chuong\3_Khao_sat_phan_tich.tex'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

uc12_start = content.find('\\subsection{Đặc tả Use Case UC12')
uc14_start = content.find('\\subsection{Đặc tả Use Case UC14')

sec36_start = content.find('\\section{Biểu đồ tuần tự (Sequence Diagram)}')
sec37_start = content.find('\\section{Biểu đồ chuyển trạng thái (State Diagram)}')

if uc12_start == -1 or uc14_start == -1 or sec36_start == -1 or sec37_start == -1:
    print("Could not find sections!")
    sys.exit(1)

new_uc12 = r'''\subsection{Đặc tả Use Case UC12 -- Booking Carpooling}

\begin{table}[H]
\centering
\caption{Đặc tả Use Case UC12 -- Booking Carpooling} \label{tab:uc12_spec}
\begin{tabularx}{\textwidth}{|p{3.5cm}|X|}
\hline
\textbf{Thuộc tính} & \textbf{Nội dung} \\ \hline
\textbf{Mã Use Case} & UC12 \\ \hline
\textbf{Tên Use Case} & Booking Carpooling \\ \hline
\textbf{Mục tiêu} & Cho phép Passenger gửi yêu cầu Booking đối với một chuyến Carpooling đang mở để chờ Driver xác nhận. \\ \hline
\textbf{Tác nhân chính} & Passenger \\ \hline
\textbf{Tác nhân phụ} & Driver \\ \hline
\textbf{Phạm vi} & Hệ thống CoRide \\ \hline
\textbf{Sự kiện kích hoạt} & Passenger chọn chức năng Đặt chỗ \\ \hline
\textbf{Tiền điều kiện} & 
(1) Passenger đã đăng nhập hệ thống.\newline
(2) Ride đang ở trạng thái SCHEDULED.\newline
(3) Ride còn đủ ghế trống.\newline
(4) Passenger chưa có Booking đang hoạt động cho cùng Ride.\newline
(5) Passenger không phải người tạo Ride.\newline
(6) Số ghế yêu cầu hợp lệ. \\ \hline
\textbf{Hậu điều kiện} & Nếu thành công, hệ thống tạo một Booking mới với trạng thái PENDING và gửi thông báo đến Driver để xử lý yêu cầu. \\ \hline
\textbf{Luồng sự kiện chính} & 
1. Passenger tìm kiếm và chọn một chuyến Carpooling phù hợp.\newline
2. Hệ thống hiển thị thông tin chi tiết của Ride.\newline
3. Passenger chọn chức năng Booking.\newline
4. Hệ thống kiểm tra trạng thái Ride là SCHEDULED và còn đủ số ghế.\newline
5. Hệ thống kiểm tra Passenger chưa có Booking hợp lệ đối với Ride này và không phải là người tạo Ride.\newline
6. Hệ thống tạo bản ghi Booking với trạng thái PENDING.\newline
7. Hệ thống gửi thông báo tới Driver về yêu cầu Booking mới.\newline
8. Hệ thống thông báo Passenger gửi yêu cầu thành công. \\ \hline
\textbf{Luồng phát sinh} & 
\textbf{A1. Ride không đủ ghế hoặc không hợp lệ}\newline
Tại bước 4, nếu Ride không còn đủ số ghế yêu cầu hoặc không ở trạng thái SCHEDULED, hệ thống từ chối yêu cầu Booking và hiển thị thông báo lỗi tương ứng. Use Case kết thúc.\newline\newline
\textbf{A2. Vi phạm quy tắc Booking}\\newline{}Tại bước 5, nếu Passenger đã có một Booking đang hoạt động đối với Ride này hoặc Passenger chính là người tạo chuyến, hệ thống từ chối tạo Booking và hiển thị thông báo lỗi. Use Case kết thúc.\newline\newline
\textbf{A3. Lỗi lưu dữ liệu}\\newline{}Tại bước 6, nếu xảy ra lỗi khi tạo Booking, hệ thống hủy toàn bộ thao tác, không lưu Booking và hiển thị thông báo "Gửi yêu cầu Booking không thành công". Use Case kết thúc. \\ \hline
\textbf{Quy tắc nghiệp vụ} & 
- Passenger không được Booking chuyến do chính mình tạo.\newline
- Không thể gửi Booking nếu số ghế yêu cầu vượt quá số ghế còn lại.\newline
- Một Passenger chỉ có thể giữ một Booking PENDING hoặc CONFIRMED cho cùng một chuyến.\newline
- Việc tạo Booking PENDING không làm giảm số ghế khả dụng. Kiểm soát overbooking được thực hiện khi Driver xác nhận Booking tại UC13 bằng Database Transaction và cập nhật có điều kiện nguyên tử. \\ \hline
\end{tabularx}
\end{table}

\begin{figure}[H]
    \centering
    % \includegraphics[width=\textwidth,height=0.95\textheight,keepaspectratio]{Hinhve/act_uc12.png}
    \caption{Biểu đồ hoạt động Use Case UC12 - Booking Carpooling}
    \label{fig:act_uc12}
\end{figure}

Biểu đồ hoạt động tại Hình~\ref{fig:act_uc12} mô tả toàn bộ quy trình từ khi Passenger lựa chọn Ride đến khi hệ thống tạo yêu cầu Booking. Quy trình bắt đầu bằng việc Passenger chọn một chuyến Carpooling phù hợp, sau đó hệ thống lần lượt kiểm tra trạng thái Ride, số ghế còn trống và các điều kiện ràng buộc như sự tồn tại của Booking cũ hay kiểm tra người tạo chuyến. Nếu bất kỳ điều kiện nào không được đáp ứng, hệ thống sẽ dừng quy trình và trả về thông báo lỗi tương ứng. Ngược lại, khi việc tạo Booking thành công, hệ thống lưu bản ghi với trạng thái PENDING và gửi thông báo tới Driver. Cách mô tả này phản ánh rõ luồng nghiệp vụ chính và các nhánh xử lý ngoại lệ, đồng thời làm rõ việc tạo Booking không trực tiếp trừ ghế, bảo đảm an toàn dữ liệu cho hệ thống.

\subsection{Đặc tả Use Case UC13 -- Xử lý yêu cầu Booking}

\begin{table}[H]
\centering
\caption{Đặc tả Use Case UC13 -- Xử lý yêu cầu Booking} \label{tab:uc13_spec}
\begin{tabularx}{\textwidth}{|p{3.5cm}|X|}
\hline
\textbf{Thuộc tính} & \textbf{Nội dung} \\ \hline
\textbf{Mã Use Case} & UC13 \\ \hline
\textbf{Tên Use Case} & Xử lý yêu cầu Booking \\ \hline
\textbf{Mục tiêu} & Cho phép Driver xem và xử lý các yêu cầu Booking của Passenger đối với chuyến Carpooling do mình tạo. \\ \hline
\textbf{Tác nhân chính} & Driver \\ \hline
\textbf{Tác nhân phụ} & Passenger \\ \hline
\textbf{Phạm vi} & Hệ thống CoRide \\ \hline
\textbf{Sự kiện kích hoạt} & Driver chọn chức năng Xử lý yêu cầu Booking \\ \hline
\textbf{Tiền điều kiện} & 
(1) Driver đã đăng nhập.\newline
(2) Driver là người tạo chuyến Carpooling.\newline
(3) Booking tồn tại và đang ở trạng thái PENDING. \\ \hline
\textbf{Hậu điều kiện} & Booking được cập nhật sang CONFIRMED hoặc REJECTED. Nếu xác nhận thành công, số ghế khả dụng của Ride được cập nhật và Passenger nhận được thông báo kết quả. \\ \hline
\textbf{Luồng sự kiện chính} & 
1. Driver mở danh sách các yêu cầu Booking của Ride.\newline
2. Hệ thống hiển thị các Booking đang ở trạng thái PENDING.\newline
3. Driver chọn một Booking cần xử lý.\newline
4. Driver chọn Chấp nhận yêu cầu Booking.\newline
5. Hệ thống kiểm tra trạng thái Booking và số ghế còn trống của Ride.\newline
6. Hệ thống cập nhật Booking sang trạng thái CONFIRMED và giảm số ghế còn lại của Ride.\newline
7. Hệ thống gửi thông báo kết quả tới Passenger.\newline
8. Hệ thống hiển thị thông báo xử lý thành công. \\ \hline
\textbf{Luồng phát sinh} & 
\textbf{A1. Driver từ chối yêu cầu}\\newline{}Tại bước 4, nếu Driver chọn "Từ chối", hệ thống cập nhật trạng thái Booking thành REJECTED và gửi thông báo kết quả tới Passenger. Use Case kết thúc.\newline\newline
\textbf{A2. Không còn đủ ghế trống}\\newline{}Tại bước 5, nếu số ghế còn lại của Ride không đáp ứng số ghế Passenger yêu cầu, hệ thống từ chối thao tác xác nhận và giữ Booking ở trạng thái PENDING để Driver tiếp tục xử lý. Hệ thống thông báo "Ride không còn đủ số ghế yêu cầu". Use Case kết thúc.\newline\newline
\textbf{A3. Booking đã được xử lý}\newline
Tại bước 5, nếu Booking không còn ở trạng thái PENDING, hệ thống từ chối thao tác. Hệ thống hiển thị thông báo Booking đã được xử lý trước đó. Use Case kết thúc.\newline\newline
\textbf{A4. Lỗi cập nhật dữ liệu}\newline
Nếu xảy ra lỗi trong quá trình cập nhật Booking hoặc số ghế, hệ thống hủy thao tác cập nhật. Hệ thống thông báo xử lý không thành công. \\ \hline
\textbf{Quy tắc nghiệp vụ} & 
- Một Booking chỉ được xử lý một lần (PENDING $\rightarrow$ CONFIRMED hoặc REJECTED).
\newline
- Không được xác nhận vượt quá số ghế khả dụng của chuyến.
\newline
- Driver chỉ xử lý Booking của chính chuyến đi do mình tạo.
\newline
- Khi xác nhận, hệ thống phải trừ đúng số lượng ghế từ số ghế khả dụng bằng Database Transaction.
\newline
- Booking đã bị từ chối không thể được khôi phục trạng thái. \\ \hline
\end{tabularx}
\end{table}

Trong hệ thống CoRide, việc xác nhận Booking được thực hiện theo cơ chế Transaction cơ sở dữ liệu (transaction) kết hợp với cập nhật nguyên tử số ghế còn lại nhằm tránh hiện tượng nhiều Passenger đồng thời được xác nhận vượt quá số ghế khả dụng (overbooking). Chi tiết kỹ thuật triển khai sẽ được phân tích ở phần thiết kế và Sequence Diagram, không trình bày trong Use Case Specification vì đặc tả Use Case chỉ mô tả hành vi nghiệp vụ của hệ thống.

\begin{figure}[H]
    \centering
    % \includegraphics[width=\textwidth,height=0.95\textheight,keepaspectratio]{Hinhve/act_uc13.png}
    \caption{Biểu đồ hoạt động Use Case UC13 - Xử lý yêu cầu Booking}
    \label{fig:act_uc13}
\end{figure}

Biểu đồ hoạt động tại Hình~\ref{fig:act_uc13} mô tả quy trình xử lý một yêu cầu Booking từ khi Driver mở danh sách Booking đến khi hệ thống cập nhật kết quả xử lý. Sau khi Driver lựa chọn một yêu cầu, hệ thống kiểm tra trạng thái hiện tại của Booking và số ghế còn trống của Ride. Nếu các điều kiện đều thỏa mãn và Driver chấp nhận yêu cầu, hệ thống cập nhật trạng thái Booking thành CONFIRMED, điều chỉnh số ghế khả dụng của Ride và gửi thông báo cho Passenger. Ngược lại, nếu Driver từ chối hoặc điều kiện xử lý không còn hợp lệ, hệ thống cập nhật trạng thái phù hợp hoặc trả về thông báo lỗi. Quy trình này thể hiện rõ các nhánh quyết định và là cơ sở để xây dựng Sequence Diagram cũng như State Machine Diagram của đối tượng Booking ở các mục tiếp theo.

'''

new_sec36 = r'''\section{Biểu đồ tuần tự (Sequence Diagram)}

Biểu đồ tuần tự được sử dụng để mô tả sự tương tác giữa các tác nhân và các thành phần của hệ thống theo thứ tự thời gian. Nếu biểu đồ hoạt động tập trung vào luồng nghiệp vụ thì biểu đồ tuần tự làm rõ thành phần nào gửi yêu cầu, thành phần nào xử lý và thứ tự các thông điệp được trao đổi trong quá trình thực hiện nghiệp vụ.

Trong CoRide, các biểu đồ tuần tự được xây dựng cho những nghiệp vụ có sự phối hợp giữa nhiều thành phần hoặc có cơ chế xử lý đáng chú ý, gồm đăng nhập, xác thực Driver, tạo chuyến Carpooling, xử lý Booking, điều phối Ride-Hailing, thanh toán, ví điện tử và trao đổi tin nhắn thời gian thực.

\subsection{Biểu đồ tuần tự đăng nhập hệ thống}

\begin{figure}[H]
    \centering
    \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_login_new.pdf}
    \caption{Biểu đồ tuần tự đăng nhập hệ thống}
    \label{fig:seq_login_new}
\end{figure}

Biểu đồ trên mô tả luồng đăng nhập vào hệ thống CoRide. Người dùng gửi yêu cầu xác thực tới máy chủ, hệ thống sẽ kiểm tra thông tin và trả về JWT token nếu hợp lệ. Việc sử dụng token giúp duy trì phiên đăng nhập và bảo mật các API tiếp theo mà không cần lưu trữ trạng thái người dùng (stateless) trên hệ thống.

\subsection{Biểu đồ tuần tự gửi và xét duyệt hồ sơ Driver}

\begin{figure}[H]
    \centering
    \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_kyc_submit.pdf}
    \caption{Biểu đồ tuần tự gửi hồ sơ xác thực Driver}
    \label{fig:seq_kyc_submit}
\end{figure}

Người dùng tải lên các hình ảnh liên quan đến giấy phép lái xe và giấy đăng ký phương tiện. Thông tin được lưu vào cơ sở dữ liệu với trạng thái PENDING để chờ quản trị viên xử lý.

\begin{figure}[H]
    \centering
    \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_kyc_review.pdf}
    \caption{Biểu đồ tuần tự Admin duyệt hồ sơ Driver}
    \label{fig:seq_kyc_review}
\end{figure}

Quản trị viên xem xét hồ sơ và quyết định phê duyệt (APPROVED) hoặc từ chối (REJECTED). Nếu phê duyệt, hệ thống sẽ cấp quyền Driver cho người dùng thông qua việc cập nhật vai trò, cho phép người dùng đăng Ride hoặc tiếp nhận TripRequest.

\subsection{Biểu đồ tuần tự tạo chuyến Carpooling}

\begin{figure}[H]
    \centering
    \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_create_ride.pdf}
    \caption{Biểu đồ tuần tự tạo chuyến Carpooling}
    \label{fig:seq_create_ride}
\end{figure}

Khi Driver tạo Ride, hệ thống phải xác thực Driver hợp lệ và kiểm tra thông tin phương tiện. Sau đó, một bản ghi Ride mới được lưu vào cơ sở dữ liệu với trạng thái SCHEDULED. Driver và Passenger có thể theo dõi và thao tác với Ride này từ thời điểm tạo thành công.

\subsection{Biểu đồ tuần tự tạo và xử lý Booking}

\begin{figure}[H]
    \centering
    \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_create_booking.pdf}
    \caption{Biểu đồ tuần tự tạo Booking (Giai đoạn 1)}
    \label{fig:seq_create_booking}
\end{figure}

Trước khi tạo Booking, hệ thống thực hiện loạt kiểm tra: Ride phải ở trạng thái SCHEDULED, còn đủ ghế, Passenger chưa có Booking PENDING/CONFIRMED cho chuyến này và không phải là người tạo chuyến. Việc tạo Booking PENDING không làm giảm số ghế của chuyến; sau khi lưu vào cơ sở dữ liệu, sự kiện Socket.IO được phát để thông báo cho Driver.

\begin{figure}[H]
    \centering
    \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_process_booking.pdf}
    \caption{Biểu đồ tuần tự Driver xử lý Booking (Giai đoạn 2)}
    \label{fig:seq_process_booking}
\end{figure}

Sơ đồ trình bày việc Driver xem xét và quyết định đối với yêu cầu Booking (có thể gồm các khối lựa chọn như: Driver chấp nhận, Driver từ chối, hoặc không đủ ghế/Booking đã xử lý). Khi Driver chấp nhận, hệ thống bắt đầu một Database Transaction để kiểm tra quyền, trạng thái Booking và thực hiện cập nhật có điều kiện nguyên tử nhằm trừ số ghế khả dụng của Ride, đồng thời chuyển trạng thái Booking sang CONFIRMED. Nếu Driver từ chối, trạng thái cập nhật thành REJECTED. Tin nhắn Socket.IO thông báo trạng thái cập nhật chỉ được gửi đi sau khi quá trình transaction được commit thành công.

\subsection{Biểu đồ tuần tự điều phối Driver cho Ride-Hailing}

\begin{figure}[H]
    \centering
    \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_waterfall_matching.pdf}
    \caption{Biểu đồ tuần tự Waterfall Matching}
    \label{fig:seq_waterfall_matching}
\end{figure}

Quy trình tìm kiếm Driver theo cơ chế Waterfall Matching bắt đầu bằng việc tạo một TripRequest với trạng thái MATCHING lưu trong cơ sở dữ liệu, thông qua TripRequest Controller và Matching Service. Hệ thống lọc danh sách Driver khả dụng (có thể triển khai qua bộ đệm Redis nếu đề xuất) và phát sự kiện mời. Khi một Driver chấp nhận, việc cập nhật sử dụng điều kiện \texttt{where status = MATCHING and driverId = null} để gán chuyến, cập nhật trạng thái thành ACCEPTED nhằm tránh hiện tượng gán trùng (race condition). Nếu không còn Driver hoặc hết thời gian, trạng thái chuyến chuyển sang \texttt{NO\_DRIVER}.

\subsection{Biểu đồ tuần tự nạp tiền Wallet bằng QR mô phỏng}

\begin{figure}[H]
    \centering
    % \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_deposit_wallet.pdf}
    \caption{Biểu đồ tuần tự nạp tiền Wallet bằng QR mô phỏng}
    \label{fig:seq_deposit_wallet}
\end{figure}

Người dùng yêu cầu nạp tiền, Backend kiểm tra tính hợp lệ của số tiền, tạo mã tham chiếu duy nhất và mã QR mô phỏng. Khi người dùng xác nhận đã quét mã, hệ thống kiểm tra mã chưa hết hạn, chưa xử lý và bắt đầu Transaction: tạo WalletTransaction (DEPOSIT = SUCCESS), cập nhật nguyên tử số dư Wallet và commit. Không có sự tham gia của cổng thanh toán thực tế nào; việc nạp tiền mang tính mô phỏng nội bộ để phục vụ quy trình thanh toán của hệ thống.

\subsection{Biểu đồ tuần tự thanh toán Booking và Ride-Hailing}

\begin{figure}[H]
    \centering
    % \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_payment.pdf}
    \caption{Biểu đồ tuần tự thanh toán Booking và Ride-Hailing}
    \label{fig:seq_payment}
\end{figure}

Đối với Booking (Carpooling), thanh toán thực hiện sau khi Driver xác nhận Booking; đối với TripRequest (Ride-Hailing), thanh toán diễn ra khi chuyến đã hoàn thành. Hệ thống sử dụng khối lựa chọn (alt) để rẽ nhánh: Hành khách dùng số dư Wallet (trừ trực tiếp) hoặc quét QR mô phỏng (tạo QR chờ xác nhận). Sau khi xác nhận thành công, hệ thống tạo bản ghi Payment, ghi nhận WalletTransaction, cập nhật paymentStatus (và ghi nhận thu nhập cho Driver) trong một Database Transaction, trước khi commit và gửi thông báo.

\subsection{Biểu đồ tuần tự hoàn tiền và quyết toán}

\begin{figure}[H]
    \centering
    % \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_refund.pdf}
    \caption{Biểu đồ tuần tự hoàn tiền và quyết toán}
    \label{fig:seq_refund}
\end{figure}

Khi xảy ra hủy chuyến hợp lệ, hệ thống kiểm tra Payment ban đầu đã thành công và chưa từng bị hoàn tiền. Sau đó, thông qua Transaction, hệ thống tạo một giao dịch REFUND, cộng trả lại số tiền vào Wallet của hành khách và cập nhật paymentStatus thành REFUNDED. Luồng xử lý đảm bảo dòng tiền không bị thất thoát hoặc nhân đôi.

\subsection{Biểu đồ tuần tự Chat Realtime}

\begin{figure}[H]
    \centering
    \includegraphics[width=0.95\textwidth]{Hinhve/sources/seq_chat_realtime.pdf}
    \caption{Biểu đồ tuần tự Chat Realtime}
    \label{fig:seq_chat_realtime}
\end{figure}

Passenger Client và Driver Client trao đổi tin nhắn thông qua Socket.IO Server, Chat Service và Database. Hệ thống kiểm tra hai người dùng có nằm trong cùng một Booking hoặc TripRequest hợp lệ hay không, và nội dung tin nhắn không được rỗng. Tin nhắn phải được lưu vào cơ sở dữ liệu thành công trước khi phát sự kiện (chat:receive và ACK) đến người nhận, bảo đảm dữ liệu hội thoại không bị mất khi mất kết nối đột ngột.

'''

final_content = content[:uc12_start] + new_uc12 + content[uc14_start:sec36_start] + new_sec36 + content[sec37_start:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Done")
