//
//  RNConnectToAOD.h
//  OfficeWellApp
//
//  Created by zl on 2017/5/2.
//  Copyright © 2017年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

/** RN connect iOS  */
@interface RNConnectToOC : RCTEventEmitter<RCTBridgeModule>

/** 单例 */
+ (instancetype)sharedInstance;
- (void)sendMessage:(NSString *)msg;
- (void)changeType:(NSString *)type;

@end

@interface RCTBridge (RCTEventEmitter)

- (RCTEventEmitter *)eventEmitter;
@end

