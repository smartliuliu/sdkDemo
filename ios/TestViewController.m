

//
//  TestViewController.m
//  AwesomeProject
//
//  Created by liu on 2017/8/15.
//  Copyright © 2017年 Facebook. All rights reserved.
//

#import "TestViewController.h"
#import "RNConnectToOC.h"

@interface TestViewController () {
  UIButton *_connectBtn;
  UIButton *_upBtn;
  
  UILabel *_contentLabel;
}
@end

@implementation TestViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = [UIColor whiteColor];
  _connectBtn = [[UIButton alloc] initWithFrame:CGRectMake(50, 50, 100, 100)];
  _connectBtn.backgroundColor = [UIColor yellowColor];
  [_connectBtn setTitle:@"连接ble" forState:UIControlStateNormal];
  [_connectBtn addTarget:self action:@selector(btnClick) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:_connectBtn];
  
  
  _upBtn = [[UIButton alloc] initWithFrame:CGRectMake(250, 250, 100, 100)];
  _upBtn.backgroundColor = [UIColor greenColor];
  [_upBtn setTitle:@"向上走起" forState:UIControlStateNormal];
  [_upBtn addTarget:self action:@selector(btnClick2) forControlEvents:UIControlEventTouchUpInside];
  [self.view addSubview:_upBtn];
  
  _contentLabel = [[UILabel alloc] initWithFrame:CGRectMake(0, 350, [UIScreen mainScreen].bounds.size.width, 200)];
  _contentLabel.text = @"显示内容";
  _contentLabel.backgroundColor = [UIColor yellowColor];
  [self.view addSubview:_contentLabel];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(notifiMessage:)
                                                name:@"add"
                                              object:nil];
  
  // Do any additional setup after loading the view.
}


- (void)notifiMessage:(NSNotification*) notification {
  NSLog(@"notifiMessage:---------status：  %@", [notification object][@"status"]);
  NSLog(@"notifiMessage:---------data： %@", [notification object][@"data"]);
  _contentLabel.text = [NSString stringWithFormat:@"notifiMessage:---------status：  %@\n data： %@", [notification object][@"status"], [notification object][@"data"]];
}

// 点击连接
- (void)btnClick {
  [[NSNotificationCenter defaultCenter] postNotificationName:@"event-emitted" object:@{@"message": @"connect"}];
}


// 点击1
- (void)btnClick2 {
   [[NSNotificationCenter defaultCenter] postNotificationName:@"event-emitted" object:@{@"message":@"type======2"}];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

-(void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end
