
//
//  RNConnectToAOD.m
//  OfficeWellApp
//
//  Created by zl on 2017/5/2.
//  Copyright © 2017年 Facebook. All rights reserved.
//

#import "RNConnectToOC.h"
#import <React/RCTBridge.h>
//#import "RCTEventDispatcher.h"
#import <React/RCTEventDispatcher.h>
@implementation RNConnectToOC
@synthesize bridge = _bridge;
// 导出名字
RCT_EXPORT_MODULE();


- (NSArray<NSString *> *)supportedEvents
{
  return @[@"EventReminder"];
}



- (void)notificationMessage:(NSNotification*) notification {
  NSDictionary *dic = @{ @"message": [notification object][@"message"]};
  [self sendEventWithName:@"EventReminder" body:dic];
}


/** RN传OC参数 */
RCT_EXPORT_METHOD(RNSendMessage:(NSString *)msg){
  NSLog(@"msg: %@",msg);
  [[NSNotificationCenter defaultCenter] postNotificationName:@"add" object:@{@"message": msg}];
}


/** 发通知 */
RCT_EXPORT_METHOD(getNSNotification){
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(notificationMessage:)
                                               name:@"event-emitted"
                                             object:nil];
}

/** 移除通知 */
RCT_EXPORT_METHOD(removeNSNotification){
   [[NSNotificationCenter defaultCenter] removeObserver:self name:@"event-emitted" object:nil];
}


@end


