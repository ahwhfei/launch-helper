﻿function DecoderCommand() { }

DecoderCommand.INIT_DECODER = 0;
DecoderCommand.DECODE_H264 = 1;
DecoderCommand.DECODE_COMPLETE = 2;
DecoderCommand.CONSOLE = 3;
DecoderCommand.CHANGE_MODE = 4;
DecoderCommand.AVAILABILITY_CHANGE = 5;
DecoderCommand.TERMINATE = 5;
DecoderCommand.CHECK_TRANSFER_BEGIN = 6;
DecoderCommand.CHECK_TRANSFER_END = 7;

function DecoderType() { }
DecoderType.None = 0x0;
DecoderType.CoreAvc = 0x1;
DecoderType.CoreAvcWorker = 0x2;
DecoderType.PPAPIDecoder = 0x4;

function DecoderConstants() {}
DecoderConstants.MAX_DECODE_TIME = 300; // This maximum decode time allowed before considering falling back
DecoderConstants.MIN_FRAME_TIME = Math.floor(1000 / DecoderConstants.MAX_DECODE_TIME) + 1;
DecoderConstants.MAX_PACKETS_FOR_FALLBACK = 5;

//h264 color formats for worker
DecoderConstants.TW2_YUV420 = 6;
DecoderConstants.TW2_YUV422 = 7;
DecoderConstants.TW2_YUV444 = 8;

function FileTransferConstants(){}
FileTransferConstants.POLICY_ERROR			= 101;
FileTransferConstants.SIZE_LIMIT_ERROR		= 102;
FileTransferConstants.FILE_COUNT_ERROR		= 103;
FileTransferConstants.FILE_GENERIC_ERROR	= 104;